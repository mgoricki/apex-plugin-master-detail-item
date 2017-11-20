/*
* Plugin:  Advanced Slider
* Version: 1.0.0 (07.03.2017.)
*
* Author:  Marko Goricki, BiLog
* Mail:    mgoricki@gmail.com
* Twitter: @mgoricki
* Blog:    apexbyg.blogspot.com
*
* Depends:
*    apex/debug.js
*    apex/item.js
*
* Changes:
*
* v.1.0.0 - 20121116 - check if region is in tabbed region
* v.1.0.1 - 20140311 - heck IR class fix
* v.2.0.0 - 20160404 - ready for APEX 5
* v.2.0.1 - 20171115 - ceanup for apex.world
*
* Public Methods:
*
*   Get Options
*   $('#P6_DEPTNO').master_detail_item('option');
*
*   Get Selected Row Data
*   $('#P6_DEPTNO').master_detail_item('getSelectedRowData');
*
* Notes:
*   - for Interactive Report always set Static ID for MASTER_ID columns, also disable column hide
*
*/
(function ($) {
  $.widget("ui.master_detail_item", {
    options : {
      itemName : null,
      mrIdVal : null, // id of master report region
      drIdVal : null, // id of detail report regiond
      compPk : null, // is key in MASTER_ID composite primary key
      compPkItems : null, // list of items to set value
      triggerClickOnLoad : null,
      mrMasterColl : 'td[headers=MASTER_ID]',
      rowSelectedCSSClass : 'row-selected',
      irRepSelector : '.a-IRR-tableContainer .a-IRR-table tbody tr',
      irRepClass: '.a-IRR-table',
      classicRepSelector : '.t-Report-report tbody tr',
      valueSplitter : '#'
    },

    _privateStorage : function () {
      var uiw = this;
      uiw._vals = {
        itemName : null,
        currentVal : '',
        isIR : false,
        lastTriggered : null,
      };
      uiw._obj = {
        $item : null,
        $mr : null,
        $dr : null,
        $mrDriver : null,
        $drDriver : null
      };
    },

    // Local debug function
    _d: function (pMessage, pModule){
      if (pModule){
        apex.debug.log('MDI plugin', '['+pModule+'] :', pMessage);
      }else{
        apex.debug.log('MDI plugin:', pMessage);
      }
    },

    // Local error function
    _e: function (pText){
      apex.debug.error(pText);
    },

    // Click on first row function
		_clickOnFirstRow: function (){
			var uiw = this;
			uiw._d('start','_clickOnFirstRow');
			if (uiw.options.triggerClickOnLoad == 'Y') {
				uiw._d('...fire on page load - hide region #' + uiw._obj.$dr.attr('id'));

				if (uiw._vals.isIR) {
          uiw._d('...is IR','_clickOnFirstRow');
					uiw._obj.$mrDriverLive.parent().find('tr:nth-child(2)').trigger('click');
				} else {
          uiw._d('...is not IR','_clickOnFirstRow');
					uiw._obj.$mrDriverLive.parent().find('tr:nth-child(1)').trigger('click');
				}
			}
      uiw._d('end','_clickOnFirstRow');
		},

    // Fix for IR. Hide MASTER_ID column id header
		_fixHeader: function(){
		  var uiw = this;
      uiw._d('start','_fixHeader');

      // get selector
		  if (uiw._vals.isIR) {
				uiw._obj.$mrDriverLive = uiw._obj.$mr.find(uiw.options.irRepSelector);
        var vElemPosition = uiw._obj.$mr.find(uiw.options.irRepClass+' tbody th#MASTER_ID').index();
        uiw._obj.$mrDriverLive.parent().find('tr:nth-child(1) th:nth-child('+(parseInt(vElemPosition)+1)+')').css('display', 'none');
			} else {
				uiw._obj.$mrDriverLive = uiw._obj.$mr.find(uiw.options.classicRepSelector);
			}

			// set curosr
			uiw._obj.$mrDriverLive.each(function () {
        var vThis = $(this);
        if (vThis.parent().get(0).localName == 'tbody') {
          vThis.css('cursor', 'pointer');
        }
      });

      uiw._d('end','_fixHeader');
		},

    // check Master Report - used on rowclick and on load
    _checkMasterReport: function(pCurrentRow$){
      var uiw = this;
      var vCheckMaster = true;
      var vNoMaster = false;
      var vNoDetail = false;
      uiw._d('start', 'checkMasterReport');

      // check if master report exists and detail report exists
      vNoMaster = $('body').find(uiw._obj.$mr).length == 0;
      vNoDetail = $('body').find(uiw._obj.$dr).length == 0;
      if(vNoMaster || vNoDetail){

        // if no master report on page
        if (vNoMaster) {
          uiw._e('no master report ' + uiw.options.mrIdVal + ' on page ');
        }

        // if no detail report on page
        if (vNoDetail) {
          uiw._e('no detail report ' + uiw.options.drIdVal + ' on page ');
        }

      }

      // for selected row
      if (pCurrentRow$ && typeof pCurrentRow$ !== 'undefined'){
        // check if there's MASTER_ID column
        if (pCurrentRow$.find(uiw.options.mrMasterColl).length == 0){
          if(uiw._vals.isIR){
            uiw._e('No '+uiw.options.mrMasterColl+' column. For IR set Static ID property to MASTER_ID.');
          }else{
            uiw._e('No '+uiw.options.mrMasterColl+' column');
          }
          vCheckMaster = false;
          //apex.debug('Master Detail plugin   ....>>>> HTML attribute "' + uiw.options.mrMasterColl + '" does not exists, hide detail report ' + uiw._obj.$dr.attr('id'));
        }

        // check if row is currently selected
        if(pCurrentRow$.hasClass('row-selected')){
          uiw._d('Master row already selected');
          vCheckMaster = false;
        }
      }

      uiw._d('end', 'checkMasterReport, response = '+vCheckMaster);
      return vCheckMaster;
    },

    // set Current value
    _setCurrentValue: function(pSelector$){
      var uiw = this;
      pSelector$.parent()
               .find('tr.' + uiw.options.rowSelectedCSSClass)
               .removeClass(uiw.options.rowSelectedCSSClass);
      pSelector$.addClass(uiw.options.rowSelectedCSSClass);
      //uiw._vals.currentVal = $selector.find(uiw.options.mrMasterColl).html().replace(/<input.*/, '');
      uiw._vals.currentVal = pSelector$.find(uiw.options.mrMasterColl).text();
      if(uiw._vals.currentVal.length == 0){
        uiw._d('Master-detail Item - row value is null');
      }
    },

    // get JSON data for this.data
    _getJsonData: function(pSelector$){
      var uiw = this;

      var $jSon = '{';
      var $jSonHidden = '';
      pSelector$.children().each(function () {
        var $row = $(this);
        $jSonHidden = '';

        // need to clear that
        $jSon += '"' + $row.attr('headers') + '":"';
        var vVal;
        if ($row.find('input').length > 0) {
          if ($row.find('input').attr('type') == 'hidden') {
            vVal = $row.html().replace(/"/g, "&quot;").replace(/\n/g, " ").replace(/\\/g, "/").replace(/<input.*/, '');

            // fix if there's hidden columns -  (name HIDDEN_+CSS class)
            $row.find('input[type=hidden]').each(function () {
                $jSonHidden += '"HIDDEN_' + $(this).attr('class') + '":"' + $(this).val().replace(/"/g, "&quot;").replace(/\n/g, " ").replace(/\\/g, "/") + '",';
            });
          } else {
            vVal = $row.find('input').val().replace(/"/g, "&quot;").replace(/\n/g, " ").replace(/\\/g, "/");
          }
        } else if ($row.find('select').length > 0) {
          vVal = $row.find('select').val().replace(/"/g, "&quot;").replace(/\n/g, "<br>").replace(/\\/g, "/");
        } else {
          vVal = $row.html().replace(/"/g, "&quot;").replace(/\n/g, " ").replace(/\\/g, "/");
        }
        if ($jSonHidden) {
          $jSon += vVal + '",' + $jSonHidden;
        } else {
          $jSon += vVal + '",';
        }

      });
      $jSon = $jSon.slice(0, -1) + '}';
      uiw._d($jSon);

      uiw._vals.rowData = jQuery.parseJSON($jSon);
      return uiw._vals.rowData;
    },

    // public function - get current row data
    // toDo - clear when no data found!!
    // Example: $('#P13_DEPTNO').master_detail_item('getSelectedRowData')
    getSelectedRowData: function(){
      var uiw = this;
      return uiw._vals.rowData;
    },

    // internal function for refreshing detail reports
    _refreshDetail: function(){
      var uiw = this;

      var vRegionsArr = uiw.options.drIdVal.split(',');
      for (var i = 0; i < vRegionsArr.length; ++i) {
        apex.region(vRegionsArr[i]).refresh();

        // test: don't show if MASTER_ID item value is null
        if (uiw._vals.currentVal>0){
          $('#'+vRegionsArr[i]).show();

        }

      }

    },

    // init function
    _init : function () {
      var uiw = this;
      var vMasterOk = false;
      uiw._privateStorage();

      // set global plugin vars
      uiw._vals.itemName = uiw.options.itemName;
      uiw._obj.$item = $('#' + uiw._vals.itemName);
      uiw._obj.$mr = $('#' + uiw.options.mrIdVal);
      uiw._obj.$dr = $('#' + uiw.options.drIdVal);

      uiw._d('start', 'init');
      uiw._d('..itemName = ' + uiw._vals.itemName, 'init')
      uiw._d('..masterReportId = ' + uiw.options.mrIdVal, 'init')
      uiw._d('..detailReportId = ' + uiw.options.drIdVal, 'init')


      // check if detail is array - list of region selectors
      var itemArr = uiw.options.drIdVal.split(',');
      for (var i = 0; i < itemArr.length; ++i) {
        itemArr[i] = '#' + itemArr[i];
      }
      uiw._obj.$dr = $(itemArr.join(','));

      // check if master and detail report exists
      vMasterOk = uiw._checkMasterReport();
      if (vMasterOk) {
        // check if master report is IR
        if (uiw._obj.$mr.find(uiw.options.irRepClass).length > 0) {
          uiw._d('..master report is IR report', 'init');
          uiw._obj.$mrDriver = uiw._obj.$mr.find(uiw.options.irRepSelector);
					uiw._vals.selector = uiw.options.irRepSelector;
					uiw._vals.isIR = true;
        } else {
          uiw._d('..master report is not IR report', 'init');
          uiw._obj.$mrDriver = uiw._obj.$mr.find(uiw.options.classicRepSelector);
					uiw._vals.selector = uiw.options.classicRepSelector;
        }

        // todo: what's this?!
				uiw._obj.$mrDriver.closest('tbody').addClass('masterDetailReport');

        // ROW CLICK: event handler, on master report click
        uiw._obj.$mr.on('click', uiw._vals.selector, function (e) {
          uiw._d('start', 'master.rowclick');
          var $selector = $(this);

          // check master column
          vMasterOk = uiw._checkMasterReport($selector);

          // big IF
          // check if there's master column, and current row is not selected
          if (vMasterOk) {

            // Get current val
						uiw._setCurrentValue($selector);

            // set value of hidden field
						if (uiw._vals.currentVal.length > 0) {
							apex.debug('Master Detail plugin   ....row value = ' + uiw._vals.currentVal);

              // if composite key
							if (uiw.options.compPk == 'N') {
								$s(uiw._vals.itemName, uiw._vals.currentVal);
							} else {
								var valArr = uiw._vals.currentVal.split(uiw.options.valueSplitter);
								var cnt = 1;
								$s(uiw._vals.itemName, valArr[0]);
								$.each(uiw.options.compPkItems.split(','), function () {
								  $s($('#' + this)[0], valArr[cnt]);
								  cnt++;
								});
							}

							// get row data - return row data
							var $jSon = uiw._getJsonData($selector);

              // Refresh Detail
							uiw._refreshDetail();

              // return selected row data
							uiw._obj.$item.trigger('masterdetailrowclick', $jSon);
						}
          } // end big if
          uiw._d('end', 'master.rowclick');
        });
        // end master row click

        // MASTER REGION - BEFORE REFRESH
        uiw._obj.$mr.bind('apexbeforerefresh', function () {
          // var vTabId = $(this).attr('id');
          uiw._d('start', 'master.apexbeforerefresh');
          uiw._obj.$dr.hide();
          uiw._d('end', 'master.apexbeforerefresh');
        });

        // MASTER REGION - ON REFRESH
        uiw._obj.$mr.bind('apexrefresh', function (e) {
          uiw._d('start', 'master.apexrefresh');
          uiw._vals.lastTriggered = 'MASTER';
          uiw._d('end', 'master.apexrefresh');
        });

        // MASTER REGION - AFTER REFRESH
        uiw._obj.$mr.on('apexafterrefresh', function () {
          uiw._d('start', 'master.apexafterrefresh');
					uiw._fixHeader();


          // clear value if master is blank
          // toDo: clear session
          // what if there's message
          if (uiw._obj.$mrDriverLive.length == 0) {
            uiw._d('no data found, reset MASTER_ID', 'master.apexafterrefresh');
            uiw._vals.currentVal = '';
            uiw._vals.rowData = '';
            $s(uiw._vals.itemName, '');
            if (uiw.options.compPk == 'Y') {
              var cnt = 1;
              $.each(uiw.options.compPkItems.split(','), function () {
                $s($('#' + this)[0], '');
                cnt++;
              });
            }
            // refresh detail to clear value, there's bug with show valuie
            uiw._refreshDetail();

          // click on first row
          } else if (uiw.options.triggerClickOnLoad == 'Y') {
            uiw._d('click on first row', 'master.apexafterrefresh');
            uiw._clickOnFirstRow();

          // if item is not blank, click on selected row
          } else if (uiw._obj.$item.val() !== '') {
            uiw._d('select row', 'master.apexafterrefresh');
            // ako je postavljena vrijednost itemam klikni na odgovarajuci redak
            uiw._obj.$mrDriverLive.parent().find('td[headers="MASTER_ID"]').filter(function (){
              return $(this).text() === uiw._obj.$item.val();
            }).closest('tr').trigger('click');

          // else hide detail report
          } else {
            uiw._d('hide detail', 'master.apexafterrefresh');
            uiw._obj.$dr.hide();
            uiw._obj.$mr.trigger('MasterDetailNotClicked');
          }
          uiw._obj.$mr.trigger('MasterAfterRefreshEnd');
          uiw._d('end', 'master.apexafterrefresh');
        });
        // end apexafterrefresh master region

        // DETAIL REGION - BEFORE REFRESH
        uiw._obj.$dr.on('apexbeforerefresh', function () {
          uiw._d('start', 'detail.apexbeforerefresh');
          if (uiw._vals.currentVal){
            $(this).show();
          }
          uiw._d('end', 'detail.apexbeforerefresh');
        });


        // DETAIL REGION - ON REFRESH
        uiw._obj.$dr.bind('apexrefresh', function () {
          uiw._d('start', 'detail.apexrefresh');
          uiw._vals.lastTriggered = 'DETAIL';
          uiw._d('end', 'detail.apexrefresh');
        });

        // DETAIL REGION - AFTER REFRESH
        uiw._obj.$dr.bind('apexafterrefresh', function () {
          uiw._d('start', 'detail.apexafterrefresh');
          // fix IR headers
          if(uiw._vals.isIR){
            $(window).trigger('apexwindowresized');
          }
          uiw._d('end', 'detail.apexafterrefresh');
        });





        // ON LOAD
        $(function () {
          uiw._obj.$dr.hide();

				  // hide MASTER_ID
				  uiw._fixHeader();
				  uiw._clickOnFirstRow();

				  uiw._obj.$mr.trigger('MasterDetailOnLoadEnd');
          apex.debug('... MasterDetailOnLoadEnd triggered on #'+uiw._obj.$mr.attr('id'));
        });

        }

          uiw._obj.$mr.trigger('MasterDetailInitEnd');

          apex.debug('... MasterDetailInitEnd triggered on #'+uiw._obj.$mr.attr('id'));
          apex.debug('Master Detail plugin - init end');
        }
    });
})(apex.jQuery);

//# sourceMappingURL=hr_bilog_mgoricki_master_detail_2.0.1.js.map
