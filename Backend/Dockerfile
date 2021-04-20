# set base image (host OS)
FROM python:3.8

# set the working directory in the container
WORKDIR /app

# set env tag
ENV RUN_IN_DOCKER Yes

# copy the dependencies file to the working directory
COPY requirements.txt .

RUN apt-get update && apt-get install -y unzip unixodbc-dev

# install dependencies
RUN pip install -r requirements.txt

# copy the content of the local src directory to the working directory
COPY src/ ./src
COPY config.yaml .

RUN mkdir -p /app/unrar && \
    cd /app/unrar && \
    wget https://github.com/ReceiptManager/receipt-manager-webapp/releases/latest/download/receipt-parser-webapp.zip && \
    unzip receipt-parser-webapp.zip && \
    mkdir -p /app/webroot && \
    cp -r /app/unrar/webroot/* /app/webroot && \
    rm -rf /app/runrar

WORKDIR /app/src

# command to run on container start
CMD [ "python", "-u", "./__init__.py" ]