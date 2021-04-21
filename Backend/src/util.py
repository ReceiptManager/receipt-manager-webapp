import sqlite3
from sqlite3 import Error
import pyodbc
import uuid
import json
import yaml
import os

cfg = None
api_token = None

def create_web_config():
    web_json = "../webroot/settings/settings.json"
    web_cfg = {"backendIP": cfg['backendIP'], "backendPort": cfg['backendPort'], "backendToken": api_token, "language": cfg['backendLanguage']}
    f = open(web_json, "w")
    f.write(json.dumps(web_cfg))
    f.close()    

def check_existing_token():
    if not os.path.isfile(r'.api_token'):
        create_token()
    else:
        read_token()

    return api_token

def read_token():
    global api_token
    if not api_token:
        with open(r'.api_token') as f:
            api_token = f.readline()

def create_token():
    global api_token
    new_token = str(uuid.uuid4())[:8]
    f = open(".api_token", "w")
    f.write(new_token)
    api_token = new_token
    f.close()    

def load_conf():
    global cfg
    run_in_docker = os.environ.get('RUN_IN_DOCKER', False)
    if not cfg:
        if not run_in_docker:
            print("Running in normal mode!")
            with open("../config.yaml", "r") as ymlfile:
                cfg = yaml.load(ymlfile, Loader=yaml.FullLoader)
        else:
            print("Running in docker mode!")
            backend_ip = os.environ.get('backendIP', "")
            backend_port = os.environ.get('backendPort', "")
            backend_language = os.environ.get('backendLanguage', "")
            parser_ip = os.environ.get('parserIP', "")
            parser_port = os.environ.get('parserPort', "")
            parser_token = os.environ.get('parserToken', "")
            sql_server_ip = os.environ.get('sqlServerIP', "")
            sql_database = os.environ.get('sqlDatabase', "")
            sql_username = os.environ.get('sqlUsername', "")
            sql_password = os.environ.get('sqlPassword', "")

            tmpCfg = {"backendIP": backend_ip, "backendPort": backend_port, "backendLanguage": backend_language, "parserIP": parser_ip, "parserPort": parser_port, "parserToken": parser_token, "sqlServerIP": sql_server_ip, "sqlDatabase": sql_database, "sqlUsername": sql_username, "sqlPassword": sql_password}

            jsonCfg = json.dumps(tmpCfg)
            cfg = json.loads(jsonCfg)

    return cfg

def delete_from_DB(table_name, id):
    conn, cur = create_ms_db_conn()
    cur.execute("DELETE FROM " + table_name + " WHERE id = ?", [id])
    conn.commit()
    conn.close()

def add_or_update_to_db(to_add_table, id, to_add_value):
    conn, cur = create_ms_db_conn()

    if id:
        sql_update = ''' UPDATE ''' + to_add_table + ''' SET categoryName = ? WHERE id = ?'''
        cur.execute(sql_update, [to_add_value, id])
    else:
        id = int(str(uuid.uuid1().int)[:6])
        sql_insert = ''' INSERT INTO ''' + to_add_table +  ''' VALUES (?, ?)'''
        cur.execute(sql_insert,  [id, to_add_value])

    conn.commit()
    conn.close()

def get_data_from_db(tableName):
    conn, cur = create_ms_db_conn()

    if tableName == "categories":
        orderby = 'categoryName'
    elif tableName == "stores":
        orderby = 'storeName'

    sql_select = ''' SELECT * from ''' + tableName + ''' order by ''' + orderby
    cur.execute(sql_select)
    rows = cur.fetchall()
    conn.close()

    ret_array = json.dumps({"values": []})
    ret_json = json.loads(ret_array)

    for row in rows:
        add_array = {"name": row[1], "id": row[0]}
        ret_json["values"].append(add_array)

    return ret_json

def create_ms_db_conn():
        global cfg
        if not cfg:
            cfg = load_conf()

        conn = pyodbc.connect(Driver="{ODBC Driver 17 for SQL Server}", Server=cfg['sqlServerIP'],Database=cfg['sqlDatabase'], user=cfg['sqlUsername'], password=cfg['sqlPassword'])
        cursor = conn.cursor()

        return conn, cursor

def init_mssql_db (conn):
    create_receipts_tables = """ IF object_id('tags', 'U') is null
                                    CREATE TABLE tags (id int PRIMARY KEY, tagName nvarchar(50))
                                IF object_id('stores', 'U') is null
                                    CREATE TABLE stores (id int PRIMARY KEY, storeName nvarchar(50))
                                IF object_id('categories', 'U') is null
                                    CREATE TABLE categories (id int PRIMARY KEY, categoryName nvarchar(50))
                                IF object_id('items', 'U') is null
                                    CREATE TABLE items (id int PRIMARY KEY, itemName nvarchar(100), itemTotal decimal(15,2), categoryId int FOREIGN KEY REFERENCES categories(id))
                                IF object_id('purchasesArticles', 'U') is null
                                    CREATE TABLE purchasesArticles (id int, itemid int FOREIGN KEY REFERENCES items(id))
                                IF object_id('receipts', 'U') is null
                                    CREATE TABLE receipts (id int PRIMARY KEY, storeId int, [date] date, total decimal(15,2), tagId int FOREIGN KEY REFERENCES tags(id), purchaseId int) 
                                IF object_id('purchaseData', 'V') is null
                                    select i.itemName article_name, 1 amount, itemTotal total, c.categoryName, storeName location, date timestamp, CONVERT(varchar, r.id) id from receipts r
                                        JOIN stores s ON r.storeId = s.id
                                        JOIN purchasesArticles pa ON r.purchaseId = pa.id
                                        JOIN items i on pa.itemid = i.id
                                        JOIN categories c on c.id = i.categoryId """
    if conn:
        create_table(conn, create_receipts_tables)
    else:
        print ("Error! cannot create the database connection.")

    
def create_table(conn, sql_query):
    try:
        conn.execute(sql_query)
        conn.commit()
        conn.close()

    except Error as e:
        print(e)

def get_category_id(category_name):
    conn, cursor = create_ms_db_conn()
    cursor.execute("select TOP 1 id from categories where categoryName = ?", [category_name])
    rows = cursor.fetchone()
    conn.close()

    category_id = rows[0]

    return category_id

def get_store_id(store_name):
    conn, cursor = create_ms_db_conn()
    cursor.execute("select TOP 1 id from stores where storeName = ?", [store_name])
    rows = cursor.fetchone()
    conn.close()

    store_id = rows[0]

    return store_id