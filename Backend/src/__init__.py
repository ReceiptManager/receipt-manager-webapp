from server import server
from util import (
    create_ssl_cert,
    init_mssql_db,
    init_mysql_db,
    load_conf,
    create_web_config,
    check_existing_token,
    load_db_conn,
)


def main():
    cfg = load_conf()

    if cfg["useSSL"]:
        create_ssl_cert([cfg["backendIP"]])

    print("Using " + cfg["dbMode"] + " DB")
    if cfg["dbMode"] == "mssql":
        conn = load_db_conn()[0]
        init_mssql_db(conn)
    elif cfg["dbMode"] == "mysql":
        conn = load_db_conn()[0]
        init_mysql_db(conn)
    else:
        print("Error! No valid db mode found. Please use mssql or mysql")

    check_existing_token()
    create_web_config()
    server()


if __name__ == "__main__":
    main()