/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
var stocres=new function() {
	var confint_lambda = 0;
	var run_max = 10;
	var run_current = 0;
	var run_state="none";
	var skiponcondition_count = 0;
	// The current time runned
	var run_time = 0;
	// Saved time from pervius runs (when halt and continueing)
	var run_saved_time = 0;
	// Timestamp from when current run started

	var run_start_timestamp = 0;
	var self = this;
	
	
	
	
	
    self.show = function() {        
        setTimeout(function() {
			txt_varname.focus();
		}, 50);
    }; 
    
    
    self.title="StatRes";
     // Used for icons etc
    self.codename="stocres";
    
    self.gethelptext=function() {
        return $(stocres_help).html();
    };

	function update_skiponcondition() {
		if(stocres_chk_skiponcondition.prop("checked")) {
			stocres_txt_skiponcondition_info.html("(Skipped runs = "+skiponcondition_count+")");
		} else {
			stocres_txt_skiponcondition_info.html("");
		}
	}

	function cmd_openmodel_click() {
		frm_openmodel_load();
	}
	self.update=function() {
		stocres_varstats.update();
		stocsd_update_time_step();
	}



	/*
	run_state="running"
	run_state="halted"
	run_state="none"
	run_state="eneded"
	*/






	self.add_del_enable=function(enablevalue) {
		if(enablevalue) {
			stocres_param_locked_message.hide();
			
			
			// Enabling special settings
			/*
			stocres_special_settings.prop("disabled",false);
			stocres_special_settings.removeClass("disabled");
			*/
			stocres_chk_skiponcondition.prop("disabled", false);
			chk_sendseed.prop("disabled", false);
			
			stocres_fieldset_adddel.prop("disabled",false);
			stocres_fieldset_adddel.removeClass("disabled");
		} else {
			stocres_param_locked_message.show();
			
			
			// Enabling special settings
			/*
			stocres_special_settings.prop("disabled",true);
			stocres_special_settings.addClass("disabled");
			*/
			
			stocres_chk_skiponcondition.prop("disabled", true);
			chk_sendseed.prop("disabled", true);
			
			stocres_fieldset_adddel.prop("disabled",true);
			stocres_fieldset_adddel.addClass("disabled");
		}
	}; 

	self.set_run_state=function(new_run_state) {
		run_state=new_run_state;
		if(run_state=="running") {
			stocsd_update_time_step();
			run_start_timestamp = get_timestamp();
			if(run_current==0) {
				rand.setseed(txt_seed_value.val());
			}
			$(".cmd_runhalt").text("Halt");
			//$(".cmd_reset").show();
		}
		if(run_state=="halted") {
			stocres_varstats.update();
			$(".cmd_runhalt").text("Continue");
			//$(".cmd_reset").show();
			run_saved_time = run_time;
		}
		if(run_state=="none") {
			$(".cmd_runhalt").text("Run");
			//$(".cmd_reset").hide();
			run_current=0;
			run_saved_time = 0;
		}
		if(run_state=="ended") {
			stocres_varstats.update();
			$(".cmd_runhalt").text("Run");
			//$(".cmd_reset").show();
		}
		stats_update();
	}

	function stats_update() {
		display_run_state=run_state;
		if(run_current>=run_max && run_state=="halted") {
			// This is a fake state, displayed to the user when finished. The actual state is halted
			display_run_state="done";
		}
		if(run_state=="none") {
			display_run_state="";
		}
		stocres_txt_status.val(display_run_state.toUpperCase());
		
		
		// Decide color for the run_state field
		switch(display_run_state.toUpperCase()) {
            case "":
                stocres_txt_status.css("background-color","white");
                break;
            case "RUNNING":
                stocres_txt_status.css("background-color","yellow");
                break;                
            case "HALTED":
				stocres_txt_status.css("background-color","#ffb554"); // Light orange
				break;
			case "DONE":
				stocres_txt_status.css("background-color","lightgreen");
                break;                
        }
		stocres_txt_current_runs.val(run_current);
		var date = new Date();
		//var datestr = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
		var datestr = date.getFullYear()+"-"+fillzeros(date.getMonth()+1,2)+"-"+fillzeros(date.getDate(),2)+"&nbsp;&nbsp;&nbsp;"+date.getHours()+":"+fillzeros(date.getMinutes(),2);
		current_time.html(datestr);
		if(run_state=="running") {
			run_time = run_saved_time+(get_timestamp()-run_start_timestamp);
		} else {
			run_time = run_saved_time
		}
		// Time elapsed
		lbl_exec_time.html(format_elapsed_time(run_time));
		// Estimated time
		if(run_current>0) {
			var est_total_time = (run_time/run_current)*run_max;
			lbl_est_time_left.html(format_elapsed_time((est_total_time-run_time)));
		}
		if(run_state=="none") {
			lbl_exec_time.html("0");
			lbl_est_time_left.html("0");
			stocres_lbl_timestep.html("");
		}
		if(display_run_state=="done") {
			lbl_est_time_left.html("0");
		}
	}

	function run() {
		if(!(run_current < run_max)) {
			// We are finished now. Show results and stop
			stocres_histogram.try_update();
			stocres_scatterplot.try_update();
			self.set_run_state("halted");
			return;
		} 
		update_rand_seed();
		debug_out("run_current");
		debug_out(run_current);
		
		get_var_array = stocres_varstats.getvarlist();
		if(get_var_array.indexOf("SkipOnCondition")==-1) {
			get_var_array.push("SkipOnCondition");
		}


		
		if(chk_showgui.prop("checked")) {
			setTimeout(function() {
				// set_var_array,get_var_array, showgui,target
				imc_run_model([],stocres_varstats.getvarlist(),true,"stocres_run_model");
			},1000);
		} else {
				imc_run_model([],stocres_varstats.getvarlist(),false,"stocres_run_model");
		}
	}

	function update_lambda() {
		var conf_level=Number($("#txt_conf_level").val());
		var opt_sides;
		if(chk_2_sided.prop("checked")) {
			opt_sides="2";
		} else {
			opt_sides="1";        
		}
		stocres_varstats.update_lambda(conf_level,opt_sides);
		txt_lambda.html("λ: "+stocres_varstats.get_confint_lambda().toFixed(3));
	}
	
	self.chk_skiponcondition_click=function() {
		if(stocres_chk_skiponcondition.prop("checked")==true) {
			// We will only allow this if skiponcondition exists
			stocres_chk_skiponcondition.prop("checked",false);
			imc_var_exists("skiponcondition", "stocres_skiponcondition_exists_return");
		} else {
			// We will always allow unchecking skiponcondition
			update_skiponcondition();
		}
	}
	
	self.skiponcondition_exists_return = function(response) {
		var skiponcondition_exists=response.returnobj.exists;
		if(skiponcondition_exists==false) {
			// If skiponcondition was not in the model
			xalert("To use SkipOnCondition there must be a variable with the name 'SkipOnCondition' in the model.");
			stocres_chk_skiponcondition.prop("checked",false);
			update_skiponcondition();
		} else {
			// If skiponcondition was in the model
			stocres_chk_skiponcondition.prop("checked",true);
			update_skiponcondition();
		}
	};
	
	
	
	
	
	
	self.input_check=function(response) {
		var skiponcondition_exists=response.returnobj.exists;
		if(stocres_chk_skiponcondition.prop("checked") && skiponcondition_exists==false) {
			xalert("SkipOnCondition can no longer be checked since its no longer in the model");
			return false;
		}


		
		if(stocres_varstats.getvarlist().length==0) {
			xalert_highlight("You must Add at least one quantity to study.",txt_varname);
			return false;
		}
		// Check if we have non added parameters
		if(txt_varname.val()!="") {
			xalert_highlight("The specified parameter '"+txt_varname.val()+"' has not been added.", txt_varname);
			return false;
		}
		return true;
	};
	
	self.try_run = function(response) {
		if(self.input_check(response)==false) {
			return;
		}
		
		
		stocres.add_del_enable(false);
		run_max=txt_num_runs.val();
		self.set_run_state("running");
		run_current=0;
		run();
		return;
	};
	
	self.runhalt_click=function() {
		if(run_state=="none") {
			imc_var_exists("skiponcondition","stocres_try_run");
			return;
		}
		if(run_state=="running") {
			self.set_run_state("halted");
			return;
		}
		if(run_state=="halted") {    
			run_max=txt_num_runs.val();
			self.set_run_state("running");
			run();
			return;
		}
	}
	
	self.reset_click=function() {
		stocres_varstats.reset_all_vars();
		self.set_run_state("none");
		skiponcondition_count=0;
		update_skiponcondition();
		stocres.add_del_enable(true);
	}
	
	self.histogram_click=function() {
		var histovar = stocres_varstats.single_selectedvar();
		if(histovar == null) {
			xalert("Exactly one quantity must be selected.");
			return;
		}
		
		var vartable=stocres_varstats.get_vartable();
		debug_out(vartable);
		stocres_histogram.set_vartable(stocres_varstats.get_vartable());
		stocres_histogram.set_varname(histovar);
		stocres_histogram.frm_histogram_load();
		
		//xalert("Histograms are not implemented yet");
	}

	self.scatterplot_click=function() {
		var selected_vars=stocres_varstats.multi_selectedvar();
		if(selected_vars.length!=2) {
			xalert("You must select exactly two quantities.");
		} else {
			stocres_scatterplot.set_vartable(stocres_varstats.get_vartable());
			stocres_scatterplot.set_varnames(selected_vars[0],selected_vars[1]);
			stocres_scatterplot.frm_scatterplot_load();
		}
	}

	self.export_txt_click=function() {
		var do_sort=$("#do_sort").prop("checked");
		var dataset=vars_to_dataset(stocres_varstats);
		if(do_sort) {
			var sortvar = stocres_varstats.single_selectedvar();
			if(sortvar != null) {
				sortdataset(dataset,sortvar);
			} else {
				xalert("Exactly one quantity must be selected.");
				return;
			}
		}
		export_txt("export.txt",dataset_tostring(dataset));
	}
	
	self.del_click=function() {
		selectedvars=stocres_varstats.multi_selectedvar();
		if(selectedvars.length==0) {
			xalert("You must select quantities to delete.");
			return;
		}
		for(i in selectedvars) {
			stocres_varstats.delvar(selectedvars[i]);
		}
	}
	
	self.add_click=function() {
			if(run_current!=0) {
				xalert("You must reset the run before you can add quantities.");
				return;
			}
			// Get quantity name from text field
			var varname = txt_varname.val().trim();

			// Check if name is specified
			if(varname == "") {
				xalert_highlight("You must name the quantity.", txt_varname);
				return;
			}
			// Ask inside maker if quantity name is correct, if so then add it
			imc_var_exists(varname,"stocres_add_var");
	};
	
	this.init=function() {
		stocres_chk_skiponcondition.click(self.chk_skiponcondition_click);
		stocres_cmd_runhalt.click(self.runhalt_click);
		stocres_cmd_add.click(self.add_click);
		stocres_cmd_del.click(self.del_click);
		stocres_cmd_reset.click(self.reset_click);
		stocres_cmd_histogram.click(self.histogram_click);
		stocres_cmd_scatterplot.click(self.scatterplot_click);
		stocres_cmd_export_txt.click(self.export_txt_click);
		
		
		
		
		txt_varname.keypress(function(e) {
			if(e.which == 13) {
				$(".cmd_add").click();
			}
		});
		
		
		
		
		
			txt_num_runs.keyup(function(e) {
				run_max=txt_num_runs.val();
				if(run_state=="running") {
					self.set_run_state("halted");
				}
				stats_update();
			});
			txt_percentile_level.keyup(function(e) {
				debug_out("txt percentile level "+txt_percentile_level.val());
				
				if(!IsNumeric(txt_percentile_level.val())) {
					// We don't want to auto update a non numeric input
					return;
				}

				var percentile_number = Number(txt_percentile_level.val());
				
				if(percentile_number>100) {
					percentile_number=100;
					txt_percentile_level.val(percentile_number);
				}
				if(percentile_number<0) {
					percentile_number=0;
					txt_percentile_level.val(percentile_number);
				}
				
				
				stocres_varstats.set_percentile_level(Number(txt_percentile_level.val()));
				stocres_varstats.update();
			});
			
			
			txt_percentile_level.focusout(function() {
				// When the user stoped typing we check more thorougly
				if(!IsNumeric(txt_percentile_level.val())) {
					xalert_highlight("Percentile needs to be a numeric value between 0 and 100", txt_percentile_level);
				}
			});
			
			
			
			run_max=txt_num_runs.val();
			self.set_run_state("none");
			frm_openmodel_open_last_model();
			$("#txt_conf_level").keyup(function() {
				update_lambda();
			});
			$(".opt_2_sided").click(function() {
				update_lambda();            
			});
			update_lambda();
			chk_sendseed.change(function() {
				toggle_sendseed();
			});
			toggle_sendseed();
		};
	function toggle_sendseed() {
		if(chk_sendseed.prop("checked")) {
			div_sendseed.css("visibility",  "visible");
		} else {
			div_sendseed.css("visibility",  "hidden");
		}
	}

	function update_rand_seed() {
		if(!chk_sendseed.prop("checked")) {
			stocsd_send_seed=null;
			return;
		}
		var seed_name = txt_seed_name.val();
		var new_seed = rand.next();
		im_set_var(seed_name,new_seed);
		stocsd_send_seed=new_seed;
		txt_seed_actual.val(new_seed);
	}
	self.run_model_return_handler=function(obj) {
			// We must fix the halt different value bug before we can fix this
			if(run_state=="none") {
				// We couldnt return data to here if we are not running
				return;
			}
            if(stocres_chk_skiponcondition.prop("checked") && obj.returnobj.variable["SkipOnCondition"]!=0) {
				skiponcondition_count++;
				update_skiponcondition();
                //xalert("SkipOnCondition is non zero. Skip");
                run();
                return;
            }
            
            // The default event for stocres return handler happens here
            // This is an execution has been finished
            if(chk_showgui.prop("checked")==false) {
				imc_simulation_close();
			}
            stocres_varstats.new_values(obj.returnobj.variable);
            
            
            stocres_histogram.try_update();
            stocres_scatterplot.try_update();
			run_current++;
			stats_update();
			if(run_state=="running") {
				run();
			}   
    };
	self.add_var_return_handler=function(obj) {
		if(obj.returnobj.exists==true) {
			stocres_varstats.addvar(obj.returnobj.varname);
			
			// Clear quantity text field, give back focus
			txt_varname.val("");
			txt_varname.focus();
		} else {
			xalert_highlight("Quantity '"+obj.returnobj.varname+"' does not exist in model.",txt_varname, function() {
				txt_varname.val("");
			});
		}
	};
	self.clear_all=function() {
		stocres_cmd_reset.click();
		setTimeout(self.clear_all_finalize, 1);
	};
	// End-phase of clear_all
	// Due to the JS asyncronse nature the JS engine need some time to process events
	// Before the controlers becomes unlocked from stocres_cmd_reset.click() and the following
	// Boxes can be unchecked
	self.clear_all_finalize=function() {
		if(stocres_chk_skiponcondition.prop("checked")) {
			stocres_chk_skiponcondition.click();
		}
		if(chk_sendseed.prop("checked")) {
			chk_sendseed.click();
		}
		if(stocres_eformat_checkbox.prop("checked")) {
			stocres_eformat_checkbox.click();
		}
		if(chk_showgui.prop("checked")) {
			chk_showgui.click();
		}
		
		// Confidence interval
		if(do_sort.prop("checked")) {
			do_sort.click();
		}
		txt_conf_level.val("95");
		
		chk_2_sided.click();
		stocres_varstats.clear_all_vars();
		txt_num_runs.val("100");
		txt_num_runs.change();
		txt_seed_value.val("123");
		stocres_free_text.val("");
		txt_percentile_level.val("50");
		stocres_lbl_timestep.html("");
	};
};
imc_return_handlers["stocres_skiponcondition_exists_return"]=stocres.skiponcondition_exists_return;


imc_return_handlers["stocres_try_run"]=stocres.try_run;



imc_return_handlers["stocres_add_var"]=stocres.add_var_return_handler;

imc_return_handlers['stocres_run_model'] = stocres.run_model_return_handler;
