import sqlite3
from sqlite3 import Error
import pyodbc
import uuid
import json
import yaml
import os.path

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

def load_conf_from_file():
    global cfg
    if not cfg:
        with open("../config.yaml", "r") as ymlfile:
            cfg = yaml.load(ymlfile, Loader=yaml.FullLoader)
    return cfg

def delete_from_DB(table_name, id):
    sqlite_con = create_db_SQLite_conn()
    cur = sqlite_con.cursor()
    cur.execute("DELETE FROM " + table_name + " WHERE id = ?", [id])
    sqlite_con.commit()
    sqlite_con.close()

def add_or_update_to_db(to_add_table, id, to_add_value):
    sqlite_con = create_db_SQLite_conn()
    cur = sqlite_con.cursor()
    if id:
        sql_update = ''' UPDATE ''' + to_add_table + ''' SET name = ? WHERE id = ?'''
        cur.execute(sql_update, [to_add_value, id])
    else:
        sql_insert = ''' INSERT INTO ''' + to_add_value +  ''' VALUES (?, ?)'''
        cur.execute(sql_insert,  [to_add_value, str(uuid.uuid4())])

    sqlite_con.commit()
    sqlite_con.close()

def get_data_from_db(tableName):
    sqlite_con = create_db_SQLite_conn()

    sql_select = ''' SELECT * from ''' + tableName + ''' order by name '''
    cur = sqlite_con.cursor()
    cur.execute(sql_select)
    rows = cur.fetchall()
    sqlite_con.close()

    ret_array = json.dumps({"values": []})
    ret_json = json.loads(ret_array)

    for row in rows:
        add_array = {"name": row[0], "id": row[1]}
        ret_json["values"].append(add_array)

    return ret_json

def create_ms_db_conn():
        global cfg
        if not cfg:
            cfg = load_conf_from_file()

        conn = pyodbc.connect(Driver="{SQL Server}", Server=cfg['sqlServerIP'],Database=cfg['sqlDatabase'], user=cfg['sqlUsername'], password=cfg['sqlPassword'])
        cursor = conn.cursor()

        return conn, cursor

def create_db_SQLite_conn():
        conn = None
        try:
            conn = sqlite3.connect(r'./receiptParser.db')
        except Error as e:
            print(e)
        
        return conn

def init_db (conn):
    create_categories_table = """CREATE TABLE IF NOT EXISTS categories 
        (
            name varchar(100),
            id varchar(20)
        )"""

    create_stores_table = """CREATE TABLE IF NOT EXISTS stores 
        (
            name varchar(100),
            id varchar(20)
        )"""

    if conn is not None:
        create_table(conn, create_categories_table)
        create_table(conn, create_stores_table)
    else:
        print ("Error! cannot create the database connection.")

def create_table(conn, sql_query):
    try:
        c = conn.cursor()
        c.execute(sql_query)
    except Error as e:
        print(e)