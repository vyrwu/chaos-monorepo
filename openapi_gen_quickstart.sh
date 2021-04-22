#!/bin/bash
docker pull openapitools/openapi-generator-cli:latest > /dev/null
print_usage() {
    echo ""
    echo "usage: ./openapi_gen_quickstart.sh <generator_name> <output_dir>"
    echo ""
    echo "to see all the generators, run: docker run openapitools/openapi-generator-cli:latest list"
    exit 1
}
trap 'print_usage' ERR
if [ -z "$1" ] || [ -z "$2" ] ; then
    print_usage
fi
GENERATOR=$1
OUT=$2
wget -q https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml
docker run -v $(PWD):/var openapitools/openapi-generator-cli:latest generate \
    -i "var/petstore.yaml" \
    -g "${GENERATOR}" \
    -o "var/${OUT}"
rm petstore.yaml
