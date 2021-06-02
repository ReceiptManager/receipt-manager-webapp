import pyodbc
import uuid
import json
import yaml
import os
import ipaddress
import socket
from mysql.connector import connect, Error
from datetime import datetime, timedelta 

from Crypto.Cipher import AES
from cryptography.fernet import Fernet
from binascii import b2a_hex, a2b_hex
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

cfg = None
api_token = None
key = None
BLOCK_SIZE = 16
SEGMENT_SIZE = 128

def encrypt(plaintext):
    key = check_existing_key()
    key = key.encode('utf-8')
    iv = key

    aes = AES.new(key, AES.MODE_CFB, iv, segment_size=SEGMENT_SIZE)
    plaintext = _pad_string(plaintext)
    encrypted_text = aes.encrypt(plaintext.encode())
    return b2a_hex(encrypted_text).rstrip().decode()

def decrypt(encrypted_text):
    key = check_existing_key()
    key = key.encode('utf-8')[:16]
    iv = key

    aes = AES.new(key, AES.MODE_CFB, iv, segment_size=SEGMENT_SIZE)
    encrypted_text_bytes = a2b_hex(encrypted_text)
    decrypted_text = aes.decrypt(encrypted_text_bytes)
    decrypted_text = _unpad_string(decrypted_text.decode())
    return decrypted_text

def _pad_string(value):
    length = len(value)
    pad_size = BLOCK_SIZE - (length % BLOCK_SIZE)
    return value.ljust(length + pad_size, '\x00')

def _unpad_string(value):
    while value[-1] == '\x00':
        value = value[:-1]
    return value

def create_ssl_cert(
    ip_addresses=None,
    ca_cert="../webroot/ssl/ca.crt",
    ca_key="../webroot/ssl/ca.key",
    key_file="ssl/key.pem",
    cert_file="ssl/cert.crt",
    ):

    root_cert = None
    root_key = None
    now = datetime.utcnow()
    if not os.path.isfile(ca_cert) and not os.path.isfile(ca_key):
        # Create CA Cert and Key
        root_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, u"DE"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, u"NRW"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, u"NV"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"ReceiptManager"),
            x509.NameAttribute(NameOID.COMMON_NAME, u"receipt-manager-ca"),
        ])
            
        basic_contraints = x509.BasicConstraints(ca=True, path_length=1)

        root_cert = (
            x509.CertificateBuilder()
            .subject_name(subject)
            .issuer_name(issuer)
            .public_key(root_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(now)
            .not_valid_after(now + timedelta(days=2 * 365))
            .add_extension(basic_contraints, False)
            .sign(root_key, hashes.SHA256(), default_backend()))

        ca_cert_pem = root_cert.public_bytes(encoding=serialization.Encoding.PEM)
        ca_key_pem = root_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        )

        open(ca_key, "wb").write(ca_key_pem)
        open(ca_cert, "wb").write(ca_cert_pem)
    
    if not os.path.isfile(cert_file) and not os.path.isfile(key_file):
        if not root_cert and not root_key:
            cert_binary = open(ca_cert,"rb").read()
            root_cert = x509.load_pem_x509_certificate(cert_binary, default_backend())
            key_binary = open(ca_key,"rb").read()
            root_key = serialization.load_pem_private_key(key_binary, None, default_backend())

        # Generate our key
        key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend(),
        )

        name = x509.Name(
            [x509.NameAttribute(NameOID.COMMON_NAME, cfg["backendHostname"])]
        )

        # best practice seem to be to include the hostname in the SAN, which *SHOULD* mean COMMON_NAME is ignored.
        alt_names = [x509.DNSName(cfg["backendHostname"]), x509.DNSName("localhost")]

        # allow addressing by IP, for when you don't have real DNS (common in most testing scenarios
        if ip_addresses:
            for addr in ip_addresses:
                # openssl wants DNSnames for ips...
                alt_names.append(x509.DNSName(addr))
                # ... whereas golang's crypto/tls is stricter, and needs IPAddresses
                # note: older versions of cryptography do not understand ip_address objects
                alt_names.append(x509.IPAddress(ipaddress.ip_address(addr)))

        san = x509.SubjectAlternativeName(alt_names)
        extended_key_usage = x509.ExtendedKeyUsage([x509.oid.ExtendedKeyUsageOID.SERVER_AUTH])

        cert = (
            x509.CertificateBuilder()
            .subject_name(name)
            .issuer_name(root_cert.issuer)
            .public_key(key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(now)
            .not_valid_after(now + timedelta(days=2 * 365))
            .add_extension(san, False)
            .add_extension(extended_key_usage, True)
            .sign(root_key, hashes.SHA256(), default_backend())
        )
        cert_pem = cert.public_bytes(encoding=serialization.Encoding.PEM)
        key_pem = key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        )

        open(key_file, "wb").write(key_pem)
        open(cert_file, "wb").write(cert_pem)

def update_server_config(settings):
    crypt_config(settings)
    load_conf(True)
    create_web_config()

def update_config_yaml(settings):
    config_file = open('../config/config.yaml', 'w')
    yaml.dump(settings, config_file)
    config_file.close()

def create_web_config():
    web_json = "../webroot/settings/settings.json"
    web_cfg = {
        "useSSL": cfg["useSSL"],
        "backendIP": cfg["backendIP"],
        "backendPort": cfg["backendPort"],
        "backendToken": api_token,
        "language": cfg["backendLanguage"]
    }
    f = open(web_json, "w")
    f.write(json.dumps(web_cfg))
    f.close()

def check_existing_key():
    if not os.path.isfile(r"../config/.key"):
        create_key()
    else:
        read_key()

    return key

def read_key():
    global key
    if not key:
        with open(r"../config/.key") as f:
            key = f.readline()

def create_key():
    global key
    new_key = Fernet.generate_key().decode('utf-8')[:16]
    f = open("../config/.key", "w")
    f.write(new_key)
    key = new_key
    f.close()

def check_existing_token():
    if not os.path.isfile(r".api_token"):
        create_token()
    else:
        read_token()

    return api_token

def read_token():
    global api_token
    if not api_token:
        with open(r".api_token") as f:
            api_token = f.readline()


def create_token():
    global api_token
    new_token = str(uuid.uuid4())[:8]
    f = open(".api_token", "w")
    f.write(new_token)
    api_token = new_token
    f.close()

def create_initial_config():
    use_ssl = os.environ.get("useSSL", False)

    if isinstance(use_ssl, str):
        if use_ssl.lower() == 'true':
            use_ssl = True
        else:
            use_ssl = False

    run_in_docker = os.environ.get("RUN_IN_DOCKER", False)
    if not run_in_docker:
        backend_ip = socket.gethostbyname(socket.gethostname())
    else:
        backend_ip = os.environ.get("backendIP", None)
        if not backend_ip:
            stream = os.popen(r"ip -4 addr show eth0 | grep -Po 'inet \K[\d.]+'")
            backend_ip = stream.read().rstrip()
    
    backend_port = os.environ.get("backendPort", 5558)

    print("Initial config created.")

    temp_config = {
        "useSSL": use_ssl,
        "backendHostname": "",
        "backendIP": backend_ip,
        "backendPort": backend_port,
        "backendLanguage": "",
        "parserIP": "",
        "parserPort": "",
        "parserToken": "",
        "dbMode": "",
        "sqlServerIP": "",
        "sqlDatabase": "",
        "sqlUsername": "",
        "sqlPassword": "",
        }

    config = json.dumps(temp_config)
    cfg = json.loads(config)
    update_config_yaml(cfg)

def load_conf(force_reload=False):
    global cfg

    if not os.path.isfile("../config/config.yaml"):
        create_initial_config()

    if not cfg or force_reload:
        with open("../config/config.yaml", "r") as ymlfile:
            cfg = yaml.load(ymlfile, Loader=yaml.FullLoader)

        cfg = crypt_config(cfg)

    return cfg

def crypt_config(settings):
    rewrite_config = False
    encrypted_cfg = settings.copy()
    
    if 'encrypted' in settings:
        is_encrypted = settings['encrypted']
    else:
        is_encrypted = False
    
    if not is_encrypted:
        rewrite_config = True

    for c, v in settings.items():
        if v and ("Token" in c or "Password" in c):
            if not is_encrypted:
                rewrite_config = True

                encrypted = encrypt(str(v))
                encrypted_cfg[c] = encrypted
            else:
                try:
                    decrypted = decrypt(str(v))
                    settings[c] = decrypted
                except Exception as e:
                    if "Non-hexadecimal digit found" in str(e):
                        print("Decryption failed. Set encryption flag in config yaml to False!")
                    else:
                        print(e)

    if rewrite_config:
        settings['encrypted'] = True
        encrypted_cfg['encrypted'] = True
        update_config_yaml(encrypted_cfg)

    return settings

def delete_from_db(table_name, id):
    conn, cur = load_db_conn()

    sql_query = "DELETE FROM " + table_name + " WHERE id = ?"
    if cfg["dbMode"] == "mysql":
        sql_query = convert_to_mysql_query(sql_query)

    cur.execute(sql_query, [id])
    conn.commit()
    conn.close()


def add_or_update_to_db(to_add_table, item_id, to_add_value):
    conn, cur = load_db_conn()

    if to_add_table == "categories":
        name_col = "categoryName"
    elif to_add_table == "stores":
        name_col = "storeName"

    if item_id:
        sql_update = (
            """ UPDATE """
            + to_add_table
            + """ SET """
            + name_col
            + """ = ? WHERE id = ?"""
        )
        if cfg["dbMode"] == "mysql":
            sql_update = convert_to_mysql_query(sql_update)

        cur.execute(sql_update, [to_add_value, item_id])
    else:
        item_id = int(str(uuid.uuid1().int)[:6])
        sql_insert = """ INSERT INTO """ + to_add_table + """ VALUES (?, ?)"""

        if cfg["dbMode"] == "mysql":
            sql_insert = convert_to_mysql_query(sql_insert)

        cur.execute(sql_insert, [item_id, to_add_value])

    conn.commit()
    conn.close()
    return item_id


def get_data_from_db(table_name):
    conn, cur = load_db_conn()

    if table_name == "categories":
        orderby = "categoryName"
    elif table_name == "stores":
        orderby = "storeName"

    sql_select = """ SELECT * from """ + table_name + """ order by """ + orderby
    cur.execute(sql_select)
    rows = cur.fetchall()
    conn.close()

    ret_array = json.dumps({"values": []})
    ret_json = json.loads(ret_array)

    for row in rows:
        add_array = {"name": row[1], "id": row[0]}
        ret_json["values"].append(add_array)

    return ret_json


def load_db_conn():
    if cfg["dbMode"] == "mssql":
        conn, cur = create_ms_db_conn()
    elif cfg["dbMode"] == "mysql":
        conn, cur = create_mysql_db_conn()
    else:
        conn = None
        cur = None
        
        print("Error! No valid db mode found. Please use mssql or mysql")

    return conn, cur


def create_ms_db_conn():
    global cfg
    if not cfg:
        cfg = load_conf()

    conn = pyodbc.connect(
        Driver="{ODBC Driver 17 for SQL Server}",
        Server=cfg["sqlServerIP"],
        Database=cfg["sqlDatabase"],
        user=cfg["sqlUsername"],
        password=cfg["sqlPassword"],
    )
    cur = conn.cursor()

    return conn, cur


def convert_to_mysql_query(sql_query):
    sql_query = sql_query.replace("?", "%s")
    return sql_query


def create_mysql_db_conn():
    global cfg
    if not cfg:
        cfg = load_conf()

    try:
        conn = connect(
            host=cfg["sqlServerIP"],
            user=cfg["sqlUsername"],
            password=cfg["sqlPassword"],
            database=cfg["sqlDatabase"],
        )
    except Error as e:
        print(e)

    cur = conn.cursor()
    return conn, cur


def init_mysql_db(conn):
    create_receipts_tags = "CREATE TABLE IF NOT EXISTS tags (id int, tagName nvarchar(50), PRIMARY KEY(id)); "
    create_receipts_stores = "CREATE TABLE IF NOT EXISTS stores (id int, storeName nvarchar(50), PRIMARY KEY(id));"
    create_receipts_categories = "CREATE TABLE IF NOT EXISTS categories (id int, categoryName nvarchar(50), PRIMARY KEY(id)); "
    create_receipts_items = "CREATE TABLE IF NOT EXISTS items (id int, itemName nvarchar(100), itemTotal decimal(15,2), categoryId int, FOREIGN KEY (categoryId) REFERENCES categories(id), PRIMARY KEY(id));"
    create_receipts_purchases_articles = " CREATE TABLE IF NOT EXISTS purchasesArticles (id int, itemid int, FOREIGN KEY (itemid) REFERENCES items(id));"
    create_receipts_receipts = " CREATE TABLE IF NOT EXISTS receipts (id int, storeId int, `date` date, total decimal(15,2), tagId int, FOREIGN KEY (tagId) REFERENCES tags(id), purchaseId int, PRIMARY KEY(id));"

    create_receipts_view = """
                                CREATE OR REPLACE VIEW purchaseData AS
                                select i.itemName article_name, 1 amount, itemTotal total, c.categoryName category, storeName location, date timestamp, CONVERT(r.id, char) id from receipts r
                                    JOIN stores s ON r.storeId = s.id
                                    JOIN purchasesArticles pa ON r.purchaseId = pa.id
                                    JOIN items i on pa.itemid = i.id
                                    JOIN categories c on c.id = i.categoryId
                           """

    if conn:
        create_mysql_table(conn, create_receipts_tags)
        create_mysql_table(conn, create_receipts_stores)
        create_mysql_table(conn, create_receipts_categories)
        create_mysql_table(conn, create_receipts_items)
        create_mysql_table(conn, create_receipts_purchases_articles)
        create_mysql_table(conn, create_receipts_receipts)
        create_mysql_table(conn, create_receipts_view)
        conn.close()
    else:
        print("Error! cannot create the database connection.")


def init_mssql_db(conn):
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
                           """
    create_receipts_view = """  IF object_id('purchaseData', 'V') is null
                                EXEC('CREATE VIEW purchaseData AS
                                    select i.itemName article_name, 1 amount, itemTotal total, c.categoryName category, storeName location, date timestamp, CONVERT(varchar, r.id) id from receipts r
                                        JOIN stores s ON r.storeId = s.id
                                        JOIN purchasesArticles pa ON r.purchaseId = pa.id
                                        JOIN items i on pa.itemid = i.id
                                        JOIN categories c on c.id = i.categoryId')
                            """
    if conn:
        create_mssql_table(conn, create_receipts_tables)
        create_mssql_table(conn, create_receipts_view)
        conn.close()
    else:
        print("Error! cannot create the database connection.")


def create_mysql_table(conn, sql_query):
    try:
        cur = conn.cursor()
        cur.execute(sql_query)
        conn.commit()

    except Error as e:
        print(e)


def create_mssql_table(conn, sql_query):
    try:
        cur = conn.cursor()
        cur.execute(sql_query)
        conn.commit()

    except pyodbc.Error as e:
        print(e)

def delete_receipt(receipt_id):
    conn, cursor = load_db_conn()
    
    sql_query = "DELETE FROM receipts WHERE ID = ?"
    if cfg["dbMode"] == "mysql":
        sql_query = convert_to_mysql_query(sql_query)
    cursor.execute(sql_query, [receipt_id])

    sql_query = "DELETE FROM purchasesArticles WHERE ID = ?"
    if cfg["dbMode"] == "mysql":
        sql_query = convert_to_mysql_query(sql_query)
    cursor.execute(sql_query, [receipt_id])

    sql_query = "DELETE FROM items where id not in (select itemid from purchasesArticles)"
    if cfg["dbMode"] == "mysql":
        sql_query = convert_to_mysql_query(sql_query)
    cursor.execute(sql_query)

    conn.commit()
    conn.close()

def get_category_id(category_name):
    conn, cursor = load_db_conn()

    sql_query = "select id from categories where categoryName = ?"
    if cfg["dbMode"] == "mysql":
        sql_query = convert_to_mysql_query(sql_query)

    cursor.execute(sql_query, [category_name])
    rows = cursor.fetchone()
    conn.close()

    if rows:
        category_id = rows[0]
    else:
        category_id = None

    return category_id

def get_store_id(store_name):
    conn, cursor = load_db_conn()

    sql_query = "select id from stores where storeName = ?"
    if cfg["dbMode"] == "mysql":
        sql_query = convert_to_mysql_query(sql_query)

    cursor.execute(sql_query, [store_name])
    rows = cursor.fetchone()
    conn.close()

    if rows:
        store_id = rows[0]
    else:
        store_id = add_or_update_to_db("stores", None, store_name)

    return store_id
