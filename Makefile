.SILENT :

# App name
APPNAME:=node-red-contrib-auth-oidc

# Base image
BASEIMAGE=node:8-onbuild

# Default configuration
ENV_FLAGS?=-e NODE_ENV=development

# Define port
PORT?=1880
PORTS_FLAGS=-p $(PORT):1880

# Custom run flags
RUN_CUSTOM_FLAGS?=$(PORTS_FLAGS) $(ENV_FLAGS)

# Include common Make tasks
root_dir:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
makefiles:=$(root_dir)/makefiles
include $(makefiles)/help.Makefile
include $(makefiles)/docker.Makefile

