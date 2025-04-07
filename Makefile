#####
# 
#####

# Make sure we pull in the scripts if they're not there yet
ifeq ("$(wildcard ./scripts/make/tasks/.*)","")
  $(shell git submodule update --init --recursive)
endif

stage   ?= local
stages  ?= local development production
 
GCR        ?= europe-west1-docker.pkg.dev/kadima-terraform/standin-works
WEB_BUCKET ?= standin.works

development_project_id  ?= standin-works-development
production_project_id   ?= standin-works-production
OSNAME := $(shell uname)

# Base directory for makefiles
MAKE_BASE_DIR = scripts/make/tasks
MAIN_BRANCH = main

project_name = $(shell basename $(shell pwd) | sed 's/-app//')

# Name the argument for convenience
baseDir = $(service)

# Some basic settings
tag		  ?= 
dry     ?= false
quiet   ?= false
type    ?= patch

# SDK
sonatype_url = https://oss.sonatype.org/content/repositories/snapshots/org/openapitools/openapi-generator-cli/7.0.0-SNAPSHOT/
binary_dir = .bin
openapi_cli = openapi-generator-cli-7.0.0-20221012.083708-4.jar
binary = $(binary_dir)/$(openapi_cli)
target = packages/standin-sdk/src/v1
docs := https://standin-works-development.kadima-tech.com/api/v1/documentation/json

# Include the jobs we need
include $(MAKE_BASE_DIR)/setup.mk
include $(MAKE_BASE_DIR)/release.mk 
include $(MAKE_BASE_DIR)/install.mk 
include $(MAKE_BASE_DIR)/compile.mk
include $(MAKE_BASE_DIR)/test.mk 

# Verify stage exists
ifneq ($(filter $(stages),$(stage)),)
ifneq ($(CI),true)
$(info Setting stage to "$(stage)")
endif
else
$(error Stage $(stage) does not exist)
endif

# Override
print.project_id:
	@echo $($(stage)_project_id)

.PHONY: init
init:
	find . -type f \( -name '.*' -name '*.yml' -name '*.json' -o -name '*.yaml' -o -name '*.tf' -o -name '*.ts' \) -exec sed -i '' 's/PROJECT_NAME/$(project_name)/g' {} +
	find .github -type f -name "*" -exec sed -i '' 's/PROJECT_NAME/$(project_name)/g' {} +

#########################
#    Gcloud Actions     #
#########################
web.deploy:
	@cd $(service) && gsutil -m rsync -R build gs://$(WEB_BUCKET)

cloudrun.deploy:
	make cloudrun.deploy.$(service)

cloudrun.deploy.%:
	gcloud run deploy $* \
				--project=$($(stage)_project_id) \
				--image=$(GCR)/$*:$(tag) \
				--region=europe-west1

#########################
#          SDK          #
#########################
sdk.setup: 
ifeq ("$(wildcard $(binary))","")
	mkdir -p $(binary_dir)
	curl $(sonatype_url)/$(openapi_cli) -o $(binary)
endif

sdk.clean:
	cd packages/standin-sdk && rm -rf intermediates

sdk.update-schema:
	echo "UPDATING"
	curl $(docs) -o packages/standin-sdk/src/assets/schema.json 

# Config: https://openapi-generator.tech/docs/generators/typescript-fetch
sdk.generate: sdk.setup sdk.clean sdk.update-schema
	java -cp $(binary) org.openapitools.codegen.OpenAPIGenerator generate -i packages/standin-sdk/src/assets/schema.json \
                        -g typescript-fetch \
                        -o $(target) \
                        --additional-properties=legacyDiscriminatorBehavior=false,disallowAdditionalPropertiesIfNotPresent=false
