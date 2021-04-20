from server import server
from util import create_db_SQLite_conn, init_db, load_conf, create_web_config, check_existing_token


def main():
    conn = create_db_SQLite_conn()
    init_db(conn)
    conn.close()

    check_existing_token()
    load_conf()
    create_web_config()
    server()

if __name__ == "__main__":
    main()