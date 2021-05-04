#/bin/bash
docker pull openapitools/openapi-generator-cli:latest > /dev/null
print_usage() {
    echo ""
    echo "usage: ./generate_server.sh <openapi_file> <output_dir>"
    echo ""
    exit 1
}
trap 'print_usage' ERR
if [ -z "$1" ] || [ -z "$2" ] ; then
    print_usage
fi
GENERATOR="nodejs-express-server"
FILE=$1
OUT=$2
docker run -v $(PWD):/var openapitools/openapi-generator-cli:latest generate \
    -i "var/${FILE}" \
    -g "${GENERATOR}" \
    -o "var/${OUT}"
