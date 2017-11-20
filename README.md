# Master Detail Item Plugin
Oracle APEX Plugin for declarative master-detail reports.

With this plugin you can easily create master-detail reports:
- all combinations of Interactive and Classic Reports as master or detail
- master-detail-detail-... reports
- integration with Interactive Grid and Chart regions
- get selected row data declaratively in Dynamic Action
- composite master primary key
- remeber row selection on region refresh or pagination change
- ...


# Changelog

- v2.0.1 - 20171120 - Initial Release

# Install
- Import plugin file item_type_plugin_hr_bilog_mgoricki_masterdetail.sql from source directory
- (Optional) To optimize performance upload static files (JS) from server directory to Webserver and change prefix to point on server directory
- (Optional) Put PL/SQL code of rendering function to the DB package

# Settings

- **Master Report ID** - Static ID of master report region

- **Report Region ID** - Static ID of detail report region

- **Composite Primary Key** - Use composite primary key (Yes/No)

- **Composite Primary Key Items** shown if Composite Primary Key property is Yes. 

    It defines page items where other part of the composite key will be stored. First key value is always stored in plugin item. Separate list of additional items with comma:
    ```javascript
    P10_ITEM_01,P10_ITEM_02,P10_ITEM_03
    ```
    
    To use composite primary key, create concatenation of keys in the MASTER_ID column, for example:
    ```sql
      select dname
           , loc
           , dname||'#'||loc as MASTER_ID
        from dept  
    ```
    Separator is defined in Component Settings (default is #).


- **Select First Row on Page Load or Refresh** - Select first row in master report on page load, region refresh or pagination change


# How to Use

1) Create master and detail report regions and set Static ID property. For example:

![Master Region](https://github.com/mgoricki/apex-plugin-master-detail-item/blob/master/images/rgnmaster.png "Master Region")

![Detail Region](https://github.com/mgoricki/apex-plugin-master-detail-item/blob/master/images/rgndetail.png "Detail Region")

2) Create column with alias MASTER_ID in master report.

    **IMPORTANT:** for Interactive Report regions you have to set column property Static ID to MASTER_ID 

3) Create Master-Detail Plugin Item and set Master and Detail Report ID's to ones defined in master and detail report regions.

You can change color of selected row under Component Settings (under Shared Components).

# Demo

Demo is available [here](https://apex.oracle.com/pls/apex/f?p=masterdetailitem). 