# Edge Computing Actions

This action was created to help deploy an edge application at Azion RTM.
To use it, you need to create an account at [Azion](https://manager.azion.com/signup/) and use configuration files.

In this action, the Azion [CLI](https://www.azion.com/en/documentation/products/cli/overview/) is used to perform the deploy.

There is an example template in this repository:

- [Example](https://github.com/aziontech/edge-upstash-geolocation)

## Example usage

```yml
- name: edge-computing-actions
  id: azion_edge
  uses: aziontech/edge-computing-actions@v1.0.0
  with:
    applicationName: "my-edge"
    azionPersonalToken: ${{ secrets.AZION_PERSONAL_TOKEN }}
    commitConfig: true
    functionFilePath: './worker/function.js'
    argsFilePath: './args.json'

- name: Get the output Azion Edge Deploy
  run: |
    echo "Message-: ${{ steps.azion_edge.outputs.message }}"
    echo "Domain-: ${{ steps.azion_edge.outputs.domainApp }}"

```

## Inputs

### `applicationName`

Edge Application Name

**Optional**

> **Note**: if not provided, the name of the repo will be used.

### `azionPersonalToken`

Personal token created in RTM Azion.

**Required**

### `commitConfig`

default: false

Boolean to commit the settings for a new deploy.
Settings: domain id, edge application id, function id.

**Optional**

> **Note**: if your branch is protected this setting needs to be manually saved in your repo.

### `functionFilePath`

default: `./worker/function.js`

your function's file path

**Optional**

### `argsFilePath`

default: `./args.json`

file path of your arguments.
Indicated to be generated in your build.

**Optional**

## Outputs

### `message`

Deploy message.

### `domainApp`

Url domain of your application
