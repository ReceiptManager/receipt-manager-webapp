from server import server
from util import init_mssql_db,create_ms_db_conn,load_conf, create_web_config, check_existing_token


def main():
    conn = create_ms_db_conn()[0]
    init_mssql_db(conn)

    check_existing_token()
    load_conf()
    create_web_config()
    server()

if __name__ == "__main__":
    main()