#!/bin/sh -l

_BASEURL_API="https://api.azionapi.net"

# azion personal token
if [[ -z "$INPUT_AZIONPERSONALTOKEN" ]]; 
then
  echo "Your Azion personal token is required, please add it in your repo secrets"
  exit 1
fi

# application name not defined get repo name
if [ -z $INPUT_APPLICATIONNAME ]; 
then
  INPUT_APPLICATIONNAME=${GITHUB_REPOSITORY##*/}
fi


if [ ! -d "./azion" ]; 
then
  echo "Folder /azion does not exist."
  echo "creating config..."
  RESULT_CREATECONFIG=$(azioncli edge_applications init --yes --name $INPUT_APPLICATIONNAME --type javascript)
  # remove build config
  echo $(jq 'del(.build)' ./azion/config.json) > ./azion/config.json
fi

# change function file and args file
echo $(jq --arg name "$INPUT_APPLICATIONNAME" '.name = $name' ./azion/azion.json ) > ./azion/azion.json
echo $(jq --arg file "$INPUT_FUNCTIONFILEPATH" '.function.file = $file' ./azion/azion.json ) > ./azion/azion.json
echo $(jq --arg file "$INPUT_ARGSFILEPATH" '.function.args = $file' ./azion/azion.json ) > ./azion/azion.json

RESULT_CONFIG_TOKEN=$(azioncli configure --token $INPUT_AZIONPERSONALTOKEN)
if [[ "$RESULT_CONFIG_TOKEN" == *"Error"* ]]; then
  echo "$RESULT_CONFIG_TOKEN"
  exit 1
fi

if [ ! -f "$INPUT_FUNCTIONFILEPATH" ]; then
  echo "File $INPUT_FUNCTIONFILEPATH does not exist. Something went wrong with your build."
  exit 1
fi

RESULT_PUBLISH=$(azioncli edge_applications publish)
echo "Result publish: $RESULT_PUBLISH"

if [[ "$RESULT_PUBLISH" == *"Error"* ]]; then
  exit 1
fi

# FIX CLI SET ARGS INSTANCE FUNCTION
_AZION_APPLICATION_ID=$(jq -r '.application.id' ./azion/azion.json)
_ARGS=$(jq -r . "$INPUT_ARGSFILEPATH")

_RESPONSE_APPLICATION_INSTANCES=$(curl \
  --silent \
  --location "$_BASEURL_API/edge_applications/$_AZION_APPLICATION_ID/functions_instances" \
  --header "Accept: application/json; version=3" \
  --header "Authorization: Token $INPUT_AZIONPERSONALTOKEN" \
  --header "Content-Type: application/json"
)

_AZION_FUNCTION_INSTANCE_ID=$(echo "$_RESPONSE_APPLICATION_INSTANCES" | jq -r '.results[0].id')

if [[ ! -z "$_AZION_FUNCTION_INSTANCE_ID" ]]; then

  _RESPONSE_APPLICATION_UPDATE_INSTANCE_ARGS=$(curl \
    --write-out '%{http_code}' --silent --output /dev/null \
    --silent \
    --location --request PATCH "$_BASEURL_API/edge_applications/$_AZION_APPLICATION_ID/functions_instances/$_AZION_FUNCTION_INSTANCE_ID" \
    --header "Accept: application/json; version=3" \
    --header "Authorization: Token $INPUT_AZIONPERSONALTOKEN" \
    --header "Content-Type: application/json" \
    -d "{\"args\": $_ARGS}"
  )

fi

DOMAIN_APP=$(echo $RESULT_PUBLISH | grep -Eo '[A-Za-z0-9._%+-]+\.[A-Za-z0-9._%+-]+\.[A-Za-z0-9._%+-]+')
echo "Success in publishing your application"

# Commit azion info edge application
if [ $INPUT_COMMITCONFIG == 'true' ]; then
  git config --global --add safe.directory /github/workspace
  git config --local user.name github-actions[bot]
  git config --local user.email github-actions[bot]@users.noreply.github.com
  git add ./azion/azion.json ./azion/config.json
  git commit -m "[bot] Automated config" || echo 'no changes commit'
  git push || echo 'no changes to push'
fi

echo "domainApp=$DOMAIN_APP" >> $GITHUB_OUTPUT
echo "message=Success Deploy!" >> $GITHUB_OUTPUT