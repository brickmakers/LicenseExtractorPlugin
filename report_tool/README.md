# License list

## Description

This scripts generate .csv files containing a report for the licenses of used node modules in your project.

## scripts
1. Add the ```licenses``` folder to your directory containing the ```package.json```.
2. Add this commands to your ```package.json``` scripts or run the commands yourself.
```json
{
    "licenses": "npm run licenses:json && npm run licenses:report",
    "licenses:summary": "license-checker --production --summary",
    "licenses:json": "license-checker --production --json --out ./licenses/usedModules.json",
    "licenses:report": "cd ./licenses && node ./reporter.js"
}
```

## Modifications

You can modify the ```known-licenses.js``` file to add more licenses or change the rules.