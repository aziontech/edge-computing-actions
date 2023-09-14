# Edge Computing Actions

This action was created to help deploy an edge application at Azion.
To use it, you need to create an account at [Azion](https://manager.azion.com/signup/) and use configuration files.

There is an example template in this repository:

- [Azion Templates](https://github.com/aziontech/azion-samples/tree/dev/templates)

## Example usage

In this example below using the template [Angular Boilerplate](https://github.com/aziontech/azion-samples/tree/dev/templates/angular-boilerplate)

```yml
- name: edge-computing-actions
  id: azion_edge
  uses: aziontech/edge-computing-actions@v0.0.1
  with:
    azionPersonalToken: ${{ secrets.AZION_PERSONAL_TOKEN }}
    functionArgsFilePath: "args.json"
    buildPreset: "angular"
    buildMode: "deliver"

- name: Get the output Azion Edge Deploy
  run: |
    echo "Application ID-= ${{ steps.azion_edge.outputs.applicationId }}"
    echo "Domain-= ${{ steps.azion_edge.outputs.domainUrl }}"
```

## Inputs

### `applicationName`

Edge Application Name

**Optional**

> **Note**: if not provided, the name of the repo will be used.

### `azionPersonalToken`

Personal token created in RTM Azion.

**Required**

### `functionArgsFilePath`

default: `args.json`

function file path of your arguments.
Indicated to be generated in your build.

> **Note**: no commit this file.

**Optional**

### `buildPreset`

Build preset by Vulcan ex: angular

```bash

  azioncli edge_applications ls

  PRESET      MODE     
  Html        Deliver  
  Javascript  Compute  
  Typescript  Compute  
  Angular     Deliver  
  Astro       Deliver  
  Hexo        Deliver  
  Next        Deliver  
  React       Deliver  
  Vue         Deliver 

```

**Required**


### `buildMode`

Build mode by Vulcan e.g: deliver

```bash

  azioncli edge_applications ls

  PRESET      MODE     
  Html        Deliver  
  Javascript  Compute  
  Typescript  Compute  
  Angular     Deliver  
  Astro       Deliver  
  Hexo        Deliver  
  Next        Deliver  
  React       Deliver  
  Vue         Deliver 

```

**Required**

### `buildEntry`

If mode compute (default: ./main.js)

**Optional**


### `edgeModuleAcceleration`

Enable module acceleration [Application Acceleration](https://www.azion.com/en/documentation/products/edge-application/application-acceleration/)

**Optional**

## Outputs

### `applicationId`

Edge Application ID

### `domainUrl`

Edge Application Domain
