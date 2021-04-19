from server import server
from util import create_db_SQLite_conn, init_db


def main():
    conn = create_db_SQLite_conn()
    init_db(conn)
    conn.close()

    server()

if __name__ == "__main__":
    main()