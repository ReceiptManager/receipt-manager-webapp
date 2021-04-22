# Receipt Manager Webapp

### Docker Install guide:
1. Install receipt parser server: [Install guide](https://receipt-parser-server.readthedocs.io/en/master/installation.html# "Install guide")
2. Disable https from parser server in config.yml
3. Pull Image `docker pull dielee/receipt-manager-webapp:latest`
4. Start mysql Container `docker run --name receiptDB --network host -e MYSQL_DATABASE=receiptData -e MYSQL_USER=receiptParser -e MYSQL_PASSWORD=receiptParser2021! -e MYSQL_RANDOM_ROOT_PASSWORD=true mysql:latest`
5. Start Container `docker run -d --network host --name "receipt-manager-webapp" -e backendIP="backendIP" -e backendPort="backendPort" -e backendLanguage="de-DE" -e parserIP="parserIP" -e parserPort="8721" -e parserToken="parserToken" -e dbMode="mssql or mysql" -e sqlServerIP="sqlServerIP" -e sqlDatabase="reciptData" -e sqlUsername="sqlUsername" -e sqlPassword="sqlPassword" dielee/receipt-manager-webapp:latest`

### Manual Install guide:
1. Install receipt parser server: [Install guide](https://receipt-parser-server.readthedocs.io/en/master/installation.html# "Install guide")
2. Disable https from parser server in config.yml
3. Download latest release from releases page: [Link](https://github.com/ReceiptManager/receipt-manager-webapp/releases "Link")
4. Unzip release and fill in settings into config.yml
5. <ins>Only Linux</ins> - Install unixODBC `sudo apt-get install unixodbc-dev`
6. Install python dependencies with `pip install -r requirements.txt`
7. Go into /src and run `python3 __init__.py` or on windows `python .\__init__.py`
8. Webapplication is now available at your IP and port defined in config.yml.
