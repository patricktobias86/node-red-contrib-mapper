node-red-contrib-mapper
=======================

A [Node-RED] node that maps the contents of a message property from one value to another, supporting multiple mapped values and regular expressions.

The message property is compared against each configured rule: you can match several values (comma-separated) or apply regex patterns (by selecting type `re`). If there’s a match, it changes to the specified replacement value.

By default, the *msg.payload* is the property that is operated on, but this can be changed to any other property, such as *msg.topic*.

If the message does not match any of the configured mappings, it can either be ignored or passed through unmodified.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install @patricktobias86/node-red-contrib-mapper

Usage Examples
--------------

✅ **Multiple values in one rule**  
You can map several values to a single replacement by entering them comma-separated, for example:  
- Search: `apple, banana, orange` → Replace: `fruit`

✅ **Regex matching**  
You can use regex patterns by selecting the `re` type for the search field:  
- Search: `^error_\\d+` (type: `re`) → Replace: `general_error`

✅ **Combining rules**  
You can combine plain and regex rules:  
- Rule 1: `yes, y, true` → `confirmed`  
- Rule 2: `^no_.*` (type: `re`) → `rejected`

💡 **Tip:** For regex, write one pattern per rule and select the `re` type.