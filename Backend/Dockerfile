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

RUN apt-get update && apt-get install -y unzip unixodbc-dev git nano
RUN ACCEPT_EULA=Y apt-get install -y msodbcsql17

# install dependencies
RUN pip install -r requirements.txt

# copy the content of the local src directory to the working directory
COPY src/ ./src
COPY config.yaml .

# clone repo
RUN git clone https://github.com/ReceiptManager/receipt-manager-webapp.git

# compile frontend with polymer
RUN apt-get install nodejs npm \
    npm install -g polymer-cli \
    cd receipt-manager-webapp/Frontend \
    polymer build 

WORKDIR /app/src

# command to run on container start
CMD [ "python", "-u", "./__init__.py" ]
