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

    if cfg["dbMode"] and cfg["sqlDatabase"] and cfg["sqlPassword"] and cfg["sqlServerIP"] and cfg["sqlUsername"]:
        print("Using " + cfg["dbMode"] + " DB")
        
        try:
            conn = load_db_conn()[0]
            if cfg["dbMode"] == "mssql":
                init_mssql_db(conn)
            elif cfg["dbMode"] == "mysql":
                init_mysql_db(conn)
            else:
                print("Error! No valid db mode found. Please use mssql or mysql")
        except Exception as e:
            print(e)
    else:
        print("No db mode set.")

    check_existing_token()
    create_web_config()
    server()


if __name__ == "__main__":
    main()