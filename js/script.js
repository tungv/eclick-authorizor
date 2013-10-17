entities = {
  CAMPAIGN: {
    name: "string",
    creator: "[USER]",
    owner: "[USER]"
  },
  USER: {
    name: "string",
    email: "string",
    managers: "COLLEC [USER]"
  },
  BANNER: {
    name: "string",
    bookingTarget: "number",
    creator: "[USER]",
    campaign: "[CAMPAIGN]"
//    "creative_banner": "CREATIVE_BANNER [WIDGET,FULLBANNER,VIDEOADS]"
  }
};

tables = {
  "USER": {
    "user_id": "integer",
    "user_name": "string",
    "user_email": "string"
  },
  "USER_MANAGER": {
    "user_id": "integer",
    "user_manager_id": "integer"
  },
  "CAMPAIGN": {
    "campaign_id": "integer",
    "campaign_name": "string",
    "campaign_creator_user_id": "integer",
    "campaign_owner_user_id": "integer"
  },
  "BANNER": {
    "banner_id": "integer",
    "banner_name": "string",
    "banner_creator_user_id": "integer",
    "banner_campaign_campaign_id": "integer"
  }
};

var TYPES = {
    'undefined'        : 'undefined',
    'number'           : 'number',
    'boolean'          : 'boolean',
    'string'           : 'string',
    '[object Function]': 'function',
    '[object RegExp]'  : 'regexp',
    '[object Array]'   : 'array',
    '[object Date]'    : 'date',
    '[object Error]'   : 'error'
  },
  TOSTRING = Object.prototype.toString;

function type(o) {
  return TYPES[typeof o] || TYPES[TOSTRING.call(o)] || (o ? 'object' : 'null');
};


/*
 * Input: IN($user, $res.creator.managers)
 * Output: select *
 from CAMPAIGN
 where USER.user_id in (
 select user_manager_id
 from USER_MANAGER
 where CAMPAIGN.campaign_creator_user_id = USER.user_id
 )

 * */


function getTypeOfEntities (entities, param){
  param = param.replace(/\$/g, '');
  var items = param.split('.')
    , result;

  for(var i=0; i<items.length; i++){
    var item = items[i];
    if(!result && entities[item]){
      result = entities[item];
    } else {
      if(result && result[item]){
        if(result[item].indexOf('[') != -1 && items[i+1]){
          result = entities[result[item].replace(/[^a-zA-Z]/g, '')][items[i+1]];
          if(result){
            return result;
          } else {return; }
        } else  result = result[item];
      } else {
        return [type(item), 'fromTypeFunction'].join('');
      }
    }
  };
  return result;
}

function checkCollectionResource (param){
  var isCollection = false
    , isResource = false;

  if(typeof param == 'object'){
    return {
      collection: false,
      resource: true
    };
  } else {
    if(param.indexOf('COLLEC') != -1){
      isCollection = true;
    } else {
      if(param.indexOf('[') != -1){
        isResource = true;
      }
    }
    return {
      collection: isCollection,
      resource: isResource
    };
  }
}

function convertOperator (operator){
  var result = '';
  switch(operator){
    case 'EQUAL':
    case 'IS'   : result = '='; break;
    case 'GT'   : result = '>'; break;
    case 'GTE'  : result = '>='; break;
    case 'LT'   : result = '<'; break;
    case 'LTE'  : result = '<='; break;
    case 'HAS'  :
    case 'STARTWITH'  :
    case 'ENDWITH'  : result = 'LIKE'; break;
    default     : result = operator;
  }
  return result;
}

function convertExpressionToQuery(expression){
  var operator = expression.match(/([A-Z]*?)\(/)[1]
    , param1 = expression.match(/\(([A-Za-z\.\'\"]*?)\,/)[1]
    , param2 = expression.match(/\,[\s]*?([A-Za-z0-9\.\'\"]*?)\)/)[1]
    , typeOfParam1 = getTypeOfEntities(entities, param1)
    , typeOfParam2 = getTypeOfEntities(entities, param2)
    , tableOfParam1 = ''
    , tableOfParam2 = '';

  if(!typeOfParam1 || !typeOfParam2){
    console.error('invalid'); return;
  }

  console.log('typeOfParam1 %s typeOfParam2 %s', typeOfParam1, typeOfParam2);

  var isCollectionParam2 = checkCollectionResource(typeOfParam2).collection
    , isResourceParam2 = checkCollectionResource(typeOfParam2).resource
    , isCollectionParam1 = checkCollectionResource(typeOfParam1).collection
    , isResourceParam1 = checkCollectionResource(typeOfParam1).resource
    , sqlQuery = '';

  //-- Param1
  if(isResourceParam1){
    tableOfParam1 = param1.split('.')[0];
    sqlQuery += tableOfParam1 + '.' +  param1.toLowerCase() + '_id ';
  } else {
    if(!isCollectionParam1){
      /*
       TODO: truong hop param = "campaign.creator.name" 'creator' là resource [USER] -> return query string
       HAS(campaign.creator.name, 'test')


       where CAMPAIGN.campaign_creator_user_id =
       (select USER.user_id
       from USER
       where USER.user_name LIKE '%test%')
       */

      ////////////////////////
//      checkResourceInParam(param1);
//      function checkResourceInParam(param){
//        var arr = param.split('.')
//          , arrKey = []
//          , temp
//          , table1, table2;
//
//        if(arr.length == 1){
//          return;
//        }
//        _.each(arr, function(item){
//          if(tables[item]){
//            table1 = item;
//          }
//          if(!temp && entities[item]){
//            temp = entities[item];
//            arrKey.push(item);
//          }
//          if(temp[item]){
//            temp = temp[item];
//            arrKey.push(item);
//          } else {
//            if(temp.indexOf('[') != -1){
//              console.log('temp', temp);
//              //table2 =
//            }
//          }
//
//        });
//      }
      ////////////////////////

      sqlQuery += [param1.split('.')[0].toUpperCase(), [param1.split('.')[0].toLowerCase(), param1.split('.')[1]].join('_')].join('.');
    }
  }

  //-- Operator
  sqlQuery += ' ' + convertOperator (operator)  + ' ';

  //-- Param2
  var subQuery = '';
  tableOfParam2 = param2.split('.')[0];

  if(!isResourceParam2 && !isCollectionParam2){
    if(typeOfParam2.indexOf('fromTypeFunction') != -1){
      var firstChar = '', lastChar = '';
      switch(operator){
        case 'HAS': {firstChar = '%'; lastChar = '%'; break;}
        case 'STARTWITH': {firstChar = '%'; break;}
        case 'ENDWITH': {lastChar = '%'; break;}
      }
      var temp = param2;
      temp = temp.replace(/\'|\"/g, '');
      temp = ["'", firstChar, temp, lastChar, "'"].join('');
      subQuery = temp;
    } else {
      /*
      * TODO: truong hop param2 = "campaign.creator.name" 'creator' là resource [USER]
      * */
      subQuery = param2.toLowerCase();
    }
  } else {
    if(isResourceParam2){
      var valName2 = tableOfParam2 + '.' + [param2.split('.').join('_').toLowerCase(), typeOfParam2.replace(/[^a-zA-Z]/g, '').toLowerCase(), 'id'].join('_');
      subQuery = valName2;
    }
    if(isCollectionParam2){
      var t1 = typeOfParam2.match(/\[([A-Z]*?)\]/)
        , arr = param2.split('.')
        , t2 = arr[arr.length-1]
        , t = '';

      t1 = _.filter(t1, function(item){
        return item.indexOf('[') == -1;
      });
      t1 = t1[0];

      valName2 = param2.replace(t2, [t1.toLowerCase(), 'id'].join('_'));

      t2 = _.reject(t2, function(ch, i){
        return t2[i]=='s' && i==t2.length-1
      }).join('').toUpperCase();

      t = [t1, t2].join('_');
      if(!tables[t]){
        console.error('%s is invalid', t);
        return;
      }

      subQuery = '( ';
      subQuery += 'select ' + t.toLowerCase() + '_id' + ' ';
      subQuery += 'from ' + t + ' ';
      subQuery += 'where ' + valName2 + ' = ' + [t.toLowerCase(), 'id'].join('_');
      subQuery += ' ) ';
    }
  }

  sqlQuery += subQuery;
  return sqlQuery;
}

function convertStringToExpression (strLanguage, resource1, resource2){
  console.log('strLanguage', strLanguage);
  strLanguage = strLanguage.replace(/\s/g, '');

  var patternMulti = /[A-Z]*?\([A-Za-z0-9.]*?\,[\s]*?[A-Za-z0-9\.\'\"]*?\)/g
    , patternSingle = /([A-Z]*?)\(([A-Za-z0-9.]*?)\,[\s]*?([A-Za-z0-9\.\'\"]*?)\)/

  var arrExpression = strLanguage.match(patternMulti)
    , arrQuery = []
    , strQuery = ''
    , associateOperator = '';

  if(arrExpression.length != 0){
    _.each(arrExpression, function(expression){
      var arr = expression.match(patternSingle);
      var str = convertExpressionToQuery(expression);
      if(str) arrQuery.push(str);
    });

    if(arrExpression.length > 1){
      associateOperator = strLanguage.match(/([A-Z]*?)\([A-Za-z\,\.\(\)\s]*?/);
      associateOperator = _.reject(associateOperator, function(item){
        return item.indexOf('(') != -1;
      });
      associateOperator = [' ', associateOperator[0], ' '].join('');
    }

    strQuery = arrQuery.join(associateOperator);
  }

  console.log(strQuery);
}

convertStringToExpression ("IS(1, 111.creator)", 'USER', 'CAMPAIGN');
/*
* EQUAL(BANNER.bookingTarget, 2000)
* STARTWITH(BANNER.name, 'HTC')
* HAS(CAMPAIGN.creator.name, 'test')
* OR(IS(USER, CAMPAIGN.creator),IN(USER, CAMPAIGN.creator.managers))
* */














