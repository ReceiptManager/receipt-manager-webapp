Docker installation guide
=================================================
The receipt-manger-webapp image gets built automatically using the `Docker Hub <https://hub.docker.com/r/dielee/receipt-manager-webapp>`_.
The installation is very simple. First pull the image from Docker hub.

.. code-block:: bash

    docker pull dielee/receipt-manager-webapp:latest

After, you need to start the MYSQL container.

.. code-block:: bash

    docker run -d --name receiptDB -p 3306:3306 -e MYSQL_DATABASE=receiptData -e MYSQL_USER=receiptParser -e MYSQL_PASSWORD=receiptParser2021! -e MYSQL_RANDOM_ROOT_PASSWORD=true mysql:latest
   
Finally, you can start the receipt-parser-webapp.

.. code-block:: bash

    docker run -d --network host --name "receipt-manager-webapp" -v /your/path/onDockerHost/ssl:/app/webroot/ssl -v /your/path/onDockerHost/config:/app/config -e backendIP="backendIP" -e backendPort="5558" -e useSSL="false" dielee/receipt-manager-webapp:latest

After the docker container is running, open the website, go to settings, and configure all open settings.

Manual installation guide
=================================================

1. Download the latest `release <https://github.com/ReceiptManager/receipt-manager-webapp/releases>`_
2. Unzip release and fill in settings into config.yml

On linux, install unixODBC and ghostscript:

.. code-block:: bash

    sudo apt-get install unixodbc-dev ghostscript

After installing ghostscript, run this to allow PDF conversion (more infos here: https://stackoverflow.com/questions/57208396/imagemagick-ghostscript-delegate-security-policy-blocking-conversion):

.. code-block:: bash

    sed 's/rights="none" pattern="PDF"/rights="read | write" pattern="PDF"/g' /etc/ImageMagick-6/policy.xml -i

On Windows, install ghostscript to enable PDF conversion from https://www.ghostscript.com/download/gsdnld.html.

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
