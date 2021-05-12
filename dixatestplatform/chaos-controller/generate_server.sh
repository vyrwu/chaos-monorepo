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
SERVER_GENERATOR="nodejs-express-server"
CLIENT_GENERATOR="typescript-axios"
FILE=$1
OUT=$2
docker run -v $(PWD):/var openapitools/openapi-generator-cli:latest generate \
    -i "var/${FILE}" \
    -g "${SERVER_GENERATOR}" \
    -o "var/${OUT}"

docker run -v $(PWD):/var openapitools/openapi-generator-cli:latest generate \
    -i "var/${FILE}" \
    -g "${CLIENT_GENERATOR}" \
    -o "var/chaos-controller"

rsync -a chaos-controller ../../ts-api/src/
rm -rf chaos-controller

echo ""
echo "UPDATING CLIENT PACKAGE"
echo ""

cd "../../ts-api"
npm version minor > /dev/null
npm i
npm publish
cd ..
