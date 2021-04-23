Docker installation guide
=================================================
The receipt-manger-webapp image gets built automatically using the `Docker Hub <https://hub.docker.com/r/dielee/receipt-manager-webapp>`_.
The installation is very simple. First pull the image from Docker hub.

.. code-block:: bash

    docker pull docker pull dielee/receipt-manager-webapp:latest

After, you need to start the MYSQL container.

.. code-block:: bash

    docker run --name receiptDB --network host -e MYSQL_DATABASE=receiptData -e MYSQL_USER=receiptParser -e MYSQL_PASSWORD=receiptParser2021! -e MYSQL_RANDOM_ROOT_PASSWORD=true mysql:latest
   
Finally, you can start the receipt-parser-webapp.

.. code-block:: bash

    docker run -d --network host --name "receipt-manager-webapp" -e backendIP="backendIP" -e backendPort="backendPort" -e backendLanguage="de-DE" -e parserIP="parserIP" -e parserPort="8721" -e parserToken="parserToken" -e dbMode="mssql or mysql" -e sqlServerIP="sqlServerIP" -e sqlDatabase="reciptData" -e sqlUsername="sqlUsername" -e sqlPassword="sqlPassword" dielee/receipt-manager-webapp:latest

Manuel installation guide
=================================================

1. Download the latest `release <https://github.com/ReceiptManager/receipt-manager-webapp/releases>`_
2. Unzip release and fill in settings into config.yml

If you use linux, install unixODBC:

.. code-block:: bash

    sudo apt-get install unixodbc-dev

Install python dependencies with:

.. code-block:: bash

    pip install -r requirements.txt

Depending if you use linux or windows, (in src/) execute:

On Linux:

.. code-block:: bash

    python3 __init__.py


On Windows:

.. code-block:: bash

   python .\__init__.py

Enable OCR support
=================================================

The OCR module is not required but if you wish, do:

1. Install receipt parser server: `Install Guide <https://receipt-parser-server.readthedocs.io/en/master/installation.html>`_
2. Disable https from parser server in config.yml