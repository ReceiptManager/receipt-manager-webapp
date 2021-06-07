# set base image (host OS)
FROM python:3.8

# set the working directory in the container
WORKDIR /app

# set env tag
ENV RUN_IN_DOCKER Yes

# copy the dependencies file to the working directory
COPY requirements.txt .

# install odbc driver
RUN curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && \
    curl https://packages.microsoft.com/config/debian/10/prod.list > /etc/apt/sources.list.d/mssql-release.list

RUN apt-get update && apt-get install -y unzip unixodbc-dev git nano ghostscript
RUN ACCEPT_EULA=Y apt-get install -y msodbcsql17

# allow ghostscript PDF conversion
RUN sed 's/rights="none" pattern="PDF"/rights="read | write" pattern="PDF"/g' /etc/ImageMagick-6/policy.xml -i

# install dependencies
RUN pip install -r requirements.txt

# copy the content of the local src directory to the working directory
COPY src/ ./src

# create config folder
RUN mkdir -p /app/config

# clone repo
RUN git clone https://github.com/ReceiptManager/receipt-manager-webapp.git

# compile frontend with polymer
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash
RUN apt-get install -y nodejs
RUN npm install -g polymer-cli
RUN cd receipt-manager-webapp/Frontend && polymer build
RUN mkdir -p /app/webroot && mkdir -p /app/webroot/ssl && mkdir -p /app/webroot/settings && cp -a receipt-manager-webapp/Frontend/build/default/. /app/webroot
RUN cp -rf receipt-manager-webapp/Frontend/lang/. /app/webroot/lang
RUN yes | cp -rf receipt-manager-webapp/Frontend/node_modules/lit-html/. /app/webroot/node_modules/lit-html
RUN cp -r receipt-manager-webapp/Frontend/node_modules/lit-element/lit-element.js.map /app/webroot/node_modules/lit-element/lit-element.js.map
RUN cp -r receipt-manager-webapp/Frontend/node_modules/lit-element/lib/*.map /app/webroot/node_modules/lit-element/lib
RUN cp -r receipt-manager-webapp/Frontend/node_modules/@webcomponents/webcomponentsjs/. /app/webroot/node_modules/@webcomponents/webcomponentsjs
RUN cp -r receipt-manager-webapp/Frontend/node_modules/web-animations-js/*.map /app/webroot/node_modules/web-animations-js
RUN cp -r receipt-manager-webapp/Frontend/img/. /app/webroot/img
RUN cp receipt-manager-webapp/Frontend/favicon.ico /app/webroot/favicon.ico
RUN rm -rf receipt-manager-webapp

WORKDIR /app/src

# command to run on container start
CMD [ "python", "-u", "./__init__.py" ]
