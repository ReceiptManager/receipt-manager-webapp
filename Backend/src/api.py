import json
import uuid
from datetime import datetime

import requests
from flask import Flask, request, send_from_directory
from flask_cors import CORS, cross_origin

from util import (
    check_existing_token,
    convert_to_mysql_query,
    get_category_id,
    get_data_from_db,
    add_or_update_to_db,
    delete_from_db,
    get_store_id,
    load_conf,
    load_db_conn,
    delete_receipt,
    update_server_config
)

app = Flask(
    __name__,
    static_url_path="",
    static_folder="../webroot",
)
cors = CORS(app, resources={r"/api/upload/*": {"origins": "*"}})
app.config["CORS_HEADERS"] = "Content-Type"

cfg = None
api_token = None


@app.before_first_request
def first():
    global cfg
    global api_token
    cfg = load_conf()
    api_token = check_existing_token()

@app.before_request
def before_request():
    if request.endpoint in ('static', 'index'):
        return

    if not request.args:
        return "No token provided! Add &token= to URL", 401

    if api_token != request.args["token"]:
        return "Unauthorized", 401

    cfg = load_conf()
    if not cfg["dbMode"] and request.endpoint != 'updateConfig':
        return "No DB Mode set!", 512

@app.route("/", methods=["GET"])
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/api/updateConfig", methods=["POST", "OPTIONS"])
@cross_origin(origin="*", headers=["Content-Type"])
def updateConfig():
    post_string = json.dumps(request.get_json())
    post_json = json.loads(post_string)

    update_server_config(post_json)

    return "Config updated", 200

@app.route("/api/upload", methods=["POST", "OPTIONS"])
@cross_origin(origin="*", headers=["Content-Type"])
def upload():
    file = request.files["file"]
    file_name = file.filename

    url = (
            "http://"
            + str(cfg["parserIP"])
            + ":"
            + str(cfg["parserPort"])
            + "/api/upload?access_token="
            + str(cfg["parserToken"])
            + "&legacy_parser=True"
            + "&grayscale_image=True"
            + "&rotate_image=True"
            + "&gaussian_blur=True"
            + "&median_blur=True"
    )

    receipt_upload = requests.post(url, files={"file": (file_name, file)})

    if receipt_upload.status_code == 200:
        upload_response = json.dumps(receipt_upload.content.decode("utf8"))
        response_json = json.loads(upload_response)
        response_json = json.loads(response_json)

        # Replace " in Date
        if '"' in response_json["receiptDate"]:
            response_json["receiptDate"] = response_json["receiptDate"].replace('"', "")

        # Create 4 digit year
        if response_json["receiptDate"] != "null":
            year_string = response_json["receiptDate"].split(".")
            if len(year_string[2]) < 4:
                year_string[2] = "20" + year_string[2]
                response_json["receiptDate"] = (
                        year_string[0] + "." + year_string[1] + "." + year_string[2]
                )

        conn, cursor = load_db_conn()
        for idx, article in enumerate(response_json["receiptItems"]):
            article = article[0]

            splitted_articles = article.split(" ")

            for article in splitted_articles:
                if len(article) > 3:

                    if cfg["dbMode"] == "mysql":
                        sql_query = "SELECT category FROM purchaseData where article_name like %s order by timestamp desc limit 1"
                    else:
                        sql_query = "SELECT TOP 1 category FROM purchaseData where article_name like ? order by timestamp desc"

                    cursor.execute(sql_query, [f"%{article}%"])
                    row = cursor.fetchone()

                    if row:
                        if cfg["dbMode"] == "mysql":
                            found_cat = row[0]
                        else:
                            found_cat = row.category

                        copy_array = response_json["receiptItems"][idx]
                        copy_array.insert(2, found_cat)

                        response_json["receiptItems"][idx] = copy_array
                        break

        conn.close()
        return json.dumps(response_json)

    else:
        return "Error on upload", receipt_upload.status_code


@app.route("/api/getHistory", methods=["GET", "OPTIONS"])
@cross_origin(origin="*", headers=["Content-Type"])
def get_history():
    conn, cursor = load_db_conn()
    history_json = []

    cursor.execute(
        "select SUM(total) as totalSum, location, id, timestamp from purchaseData \
	                where id is not null \
                    GROUP BY timestamp, id, location \
                    ORDER BY timestamp desc"
    )

    rows = cursor.fetchall()

    for row in rows:
        if cfg["dbMode"] == "mysql":
            add_json = {
                "location": row[1],
                "totalSum": str(row[0]),
                "timestamp": str(row[3]),
                "id": row[2],
            }
        else:
            add_json = {
                "location": row.location,
                "totalSum": str(row.totalSum),
                "timestamp": str(row.timestamp),
                "id": row.id,
            }
        history_json.append(add_json)

    conn.close()

    return json.dumps(history_json)


@app.route("/api/getHistoryDetails", methods=["GET", "OPTIONS"])
@cross_origin(origin="*", headers=["Content-Type"])
def get_history_details():
    purchase_id = request.args["purchaseID"]

    conn, cursor = load_db_conn()
    sql_query = (
                "SELECT storeName, total, date, purchaseId " +
                "FROM receipts re " +
                "JOIN stores st ON re.storeId = st.id " +
                "where re.id = ?"
                )

    if cfg["dbMode"] == "mysql":
        sql_query = convert_to_mysql_query(sql_query)

    cursor.execute(sql_query, [purchase_id]) 
    row = cursor.fetchone()

    if row:
        if cfg["dbMode"] == "mysql":
            store_name = row[0]
            receipt_total = row[1]
            receipt_date = row[2]
            db_purchase_id = row[3]
        else:
            store_name = row.storeName
            receipt_total = row.total
            receipt_date = row.date
            db_purchase_id = row.purchaseId
    
        receipt_date = receipt_date.strftime("%d.%m.%Y")

        purchase_details = {
            "storeName": store_name,
            "receiptTotal": str(receipt_total),
            "receiptDate": receipt_date,
            "purchaseID": db_purchase_id,
            "receiptItems": [],
        }

        sql_query = "select article_name, total, category from purchaseData where id = ?"
        if cfg["dbMode"] == "mysql":
            sql_query = convert_to_mysql_query(sql_query)

        cursor.execute(sql_query, [purchase_id])
        rows = cursor.fetchall()

        for row in rows:
            if cfg["dbMode"] == "mysql":
                add_json = [row[0], str(row[1]), row[2]]
            else:
                add_json = [row.article_name, str(row.total), row.category]

            purchase_details["receiptItems"].append(add_json)

        conn.close()

        return json.dumps(purchase_details)
    else:
        return "Purchase not found!", 500


@app.route("/api/getValue", methods=["GET", "OPTIONS"])
@cross_origin(origin="*", headers=["Content-Type"])
def get_categories():
    get_values_from = request.args["getValuesFrom"]

    ret_json = get_data_from_db(get_values_from)

    return json.dumps(ret_json, ensure_ascii=False)


@app.route("/api/addValue", methods=["POST", "OPTIONS"])
@cross_origin(origin="*", headers=["Content-Type"])
def add_value():
    to_add_array = request.args["toAddArray"]
    to_add_value = request.args["toAddValue"]
    item_id = request.args["id"]

    add_or_update_to_db(to_add_array, item_id, to_add_value)

    return "Done!"


@app.route("/api/deleteValue", methods=["POST", "OPTIONS"])
@cross_origin(origin="*", headers=["Content-Type"])
def delete_value():
    table_name = request.args["tableName"]
    item_id = request.args["id"]

    delete_from_db(table_name, item_id)

    return "Done!"

@app.route("/api/deleteReceiptFromDB", methods=["POST", "OPTIONS"])
@cross_origin(origin="*", headers=["Content-Type"])
def delete_receipt_from_db():
    receipt_id = request.args["purchaseID"]

    delete_receipt(receipt_id)

    return "Done!"

@app.route("/api/updateReceiptToDB", methods=["POST", "OPTIONS"])
@cross_origin(origin="*", headers=["Content-Type"])
def update_receipt_to_db():
    post_string = json.dumps(request.get_json())
    post_json = json.loads(post_string)

    conn, cursor = load_db_conn()

    store_id = get_store_id(post_json["storeName"])
    receipt_date = post_json["receiptDate"]
    receipt_total = post_json["receiptTotal"]
    receipt_id = post_json["purchaseID"]

    receipt_date = datetime.strptime(receipt_date, "%d.%m.%Y")
    receipt_date = receipt_date.strftime("%m-%d-%Y")

    # Clean old db data
    delete_receipt(receipt_id)

    # Write article positions
    for article in post_json["receiptItems"]:
        article_name = article[1]
        article_sum = article[2]
        article_id = int(str(uuid.uuid1().int)[:8])
        article_category_id = get_category_id(article[3])

        sql_query = "INSERT INTO items values (?,?,?,?)"
        if cfg["dbMode"] == "mysql":
            sql_query = convert_to_mysql_query(sql_query)
        cursor.execute(
            sql_query, [article_id, article_name, article_sum, article_category_id]
        )

        sql_query = "INSERT INTO purchasesArticles values (?,?)"
        if cfg["dbMode"] == "mysql":
            sql_query = convert_to_mysql_query(sql_query)
        cursor.execute(sql_query, [receipt_id, article_id])

    # Write receipt summary
    if cfg["dbMode"] == "mysql":
        sql_query = (
            "INSERT INTO receipts values (%s,%s,STR_TO_DATE(%s,'%m-%d-%Y'),%s,%s,%s)"
        )
    else:
        sql_query = "INSERT INTO receipts values (?,?,?,?,?,?)"

    cursor.execute(
        sql_query, [receipt_id, store_id, receipt_date, receipt_total, None, receipt_id]
    )

    conn.commit()
    conn.close()

    return "Done!"


@app.route("/api/writeReceiptToDB", methods=["POST", "OPTIONS"])
@cross_origin(origin="*", headers=["Content-Type"])
def write_receipt_to_db():
    post_string = json.dumps(request.get_json())
    post_json = json.loads(post_string)

    conn, cursor = load_db_conn()

    store_id = get_store_id(post_json["storeName"])
    receipt_date = post_json["receiptDate"]
    receipt_total = post_json["receiptTotal"]
    receipt_id = int(str(uuid.uuid1().int)[:6])

    receipt_date = datetime.strptime(receipt_date, "%d.%m.%Y")
    receipt_date = receipt_date.strftime("%m-%d-%Y")

    # Write article positions
    for article in post_json["receiptItems"]:
        article_id = int(str(uuid.uuid1().int)[:8])
        article_name = article[1]
        article_sum = article[2]
        article_category_id = get_category_id(article[3])

        if not article_category_id:
            return "Category id for category: " + article[3] + " not found", 500

        sql_query = "INSERT INTO items values (?,?,?,?)"
        if cfg["dbMode"] == "mysql":
            sql_query = convert_to_mysql_query(sql_query)
        cursor.execute(
            sql_query, [article_id, article_name, article_sum, article_category_id]
        )

        sql_query = "INSERT INTO purchasesArticles values (?,?)"
        if cfg["dbMode"] == "mysql":
            sql_query = convert_to_mysql_query(sql_query)
        cursor.execute(sql_query, [receipt_id, article_id])

    # Write receipt summary
    if cfg["dbMode"] == "mysql":
        sql_query = (
            "INSERT INTO receipts values (%s,%s,STR_TO_DATE(%s,'%m-%d-%Y'),%s,%s,%s)"
        )
    else:
        sql_query = "INSERT INTO receipts values (?,?,?,?,?,?)"

    cursor.execute(
        sql_query, [receipt_id, store_id, receipt_date, receipt_total, None, receipt_id]
    )

    conn.commit()
    conn.close()

    return "Done!"

@app.after_request
def add_header(r):
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r