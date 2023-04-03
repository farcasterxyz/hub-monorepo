#!/bin/bash

sudo apt update
sudo apt install docker.io -y
sudo snap install docker
sudo usermod -a -G docker ubuntu
