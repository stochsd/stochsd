/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
(function () {



var optim=new function() {
    var self=this;
    this.title="Optim";
    this.codename="optim";
    this.start_timestamp=null;
    this.run_time=0;
    this.saved_time=0;






    
    this.parameter_input_enable=function(enablevalue) {
		if(enablevalue) {
			optim_param_locked_message.hide();
			optim_param_input.prop("disabled",false);
			optim_param_input.removeClass("disabled");
		} else {
			optim_param_locked_message.show();
			optim_param_input.prop("disabled",true);
			optim_param_input.addClass("disabled");
		}
	}
    optim_optimiser.run_state_update=function(old_run_state,new_run_state) {
        // if we go from none to running
        if(old_run_state=="none" && new_run_state=="running") {
            stocsd_update_current_time();
        }

        // update run state     
        if(new_run_state=="running") {
        optim.start_timestamp = get_timestamp();
        optim_cmd_optimise.text("Halt");
            //$(".cmd_reset").show();
        }
        if(new_run_state=="halted") {
            //calc_percentiles();
            optim_cmd_optimise.text("Continue");
            optim.saved_time=optim.run_time;
        }
        if(new_run_state=="none") {
            optim_cmd_optimise.text("Optimise");
            optim.saved_time=0;
            // We want to make sure the variables are reseted after every update and other thing is finished
            // Since this asyncrone with InsightMaker events trigger StocSD events its hard to predict the order
            // Therefor we put the reseting of the variables 500 milliseconds after the reset
            setTimeout(function() {
				imc_vars_load()
				
				// Allow saving without complaining again
				delete save_hook_array["optim_modified_model"];
			}, 500);
        }
        if(new_run_state=="ended") {
            optim_cmd_optimise.text("Optimise");
        }
        optim_optimiser.update();
    }
    this.open_log=function() {
		var form_height = $(document).height()*0.8;
		var form_width = 450;
		// http://stackoverflow.com/questions/171928/hook-into-dialog-close-event
		log_form=$( "#frm_optim_log" ).dialog({ 
			resizable: true,
											  position: 'center',
											  width: 'auto',
											  height: form_height
		});
		log_form.dialog('option', 'title', optim.title+" Log");
		log_form.dialog('option','width', form_width);
		log_form.dialog('option','height', form_height);
	}
	this.req_error_validate=function() {
		// We assume that we have an error until the Requierd error is successfully parsed
		var error=true;
		var req_error_text=optim_txt_req_error.val();
		
		if(IsNumeric(req_error_text)) {
			req_error=Number(req_error_text);
			if(req_error > 0) {
				// Success
				error = false;
				optim.update_req_error();
			}
		}
		if(error) {
			highlight(optim_txt_req_error);
			xalert("You must enter a positive number for Required Accuracy.", function() {
				optim_txt_req_error.val("");
				unhighlight(optim_txt_req_error);
			});
			return;
		}
	};
    this.show = function() {    
        debug_out("this in show");
        debug_out(this);
		setTimeout(function() {
			optim_txt_varname.focus();
		}, 50);
    };
    
    this.gethelptext=function() {
        return $(optim_help).html();
    };
    this.construct = function() {

    };
    this.addvar = function(varname,start,step) {
        if(varname=="") {
            xalert_highlight("You must enter the name of the variable.", optim_txt_varname);
            return false;
        }
        
        
        
        
        
        if(!IsNumeric(start)) {
            xalert_highlight("You must enter a numeric Start value.",optim_txt_start);
            return false;
        }
        if(!IsNumeric(step)) {
            xalert_highlight("You must enter a numeric Init.Step value.",optim_txt_step);
            return false;
        }

		
        if(step<=0) {
            xalert_highlight("Init.Step must be larger than zero.",optim_txt_step);
            return false;
        }
        
        // We start by storing this in the table.
        // Even before we checked if the variable exists in the model
        // This is becouse we need to store start and step
        // In case the variable does exist in the model
        
        
        optim_optimiser.add_var(varname,start,step);
        debug_out("vartable");
        debug_out(optim_optimiser.get_vartable());
        // If we past all the initial tests, we check with 
        // the model if this variable exists
        imc_var_exists(varname,"optim_try_add_var");
        return true;
    };
    
    this.add_var_imc_return = function(response) {
        if(response.returnobj.exists==false) {
            //this.delvar(response.returnobj.varname);
            
            optim_optimiser.del_var(response.returnobj.varname);
            optim.render_vartable();
            xalert("The variable '"+response.returnobj.varname+"' does not exist in the model.");
            return;
        } else {
            optim.render_vartable();
        }
    };
    
    this.selected_vars = function() {
        var varname_array=[];
        $(".optim_varcheckbox").each(function(i,checkbox) {
            if($(checkbox).is(':checked')) {
                var varname=$(checkbox).attr("data-varname");
                varname_array.push(varname);
            }
        });
        return varname_array;
    }
    
    this.render_vartable = function() {
        output="";
        var vartable=optim_optimiser.get_vartable();
        for(var varname in vartable) {
            var varobj = vartable[varname];
            debug_out("displaying "+varname);
            output+="<tr class='optim_var_row' data-varname='"+varname+"'>";
            output+="<td><input class='optim_varcheckbox' data-varname='"+varobj.name+"' type='checkbox'/></td>";
            
            
            
            
            output+="<td class='alignleft varname_data col0'>"+varobj.name+"</td>";
            output+="<td class='alignright result_data col1'>&nbsp"+stocsd_format(varobj.start)+"&nbsp</td>";
            output+="<td class='alignright result_data col2'>&nbsp"+stocsd_format(varobj.step)+"&nbsp</td>";
            output+="<td class='alignright result_data col3'>&nbsp"+stocsd_format(varobj.best)+"&nbsp</td>";
            output+="<td class='alignright result_data col4'>&nbsp"+stocsd_format(varobj.span)+"&nbsp</td>";
            output+="</tr>";
        }
        $("#optim_tbl_vars tbody").html(output);
        if(optim_optimiser.get_run_state()!="none") {
            $(".col1").hide();
            $(".col2").hide();
            $(".col3").show();
            $(".col4").show();
        } else {
            $(".col1").show();
            $(".col2").show();
            $(".col3").hide();
            $(".col4").hide();
        }
    };
    
    
    this.construct();
    // Init should be runned after the DOM is created, but before we show the optim app
    // Init can therefor not be called as a constructor, as DOM is not already created
    
    
    this.toggle_sendseed=function() {
            optim_span_sendseed.toggle(optim_chk_sendseed.prop("checked"));
    }
    
    this.init = function() {
		
        optim_chk_sendseed.change(function() {
            self.toggle_sendseed();
        });
        optim.toggle_sendseed();
        optim_btn_add.app=this;
        
        // Add button
        $(optim_btn_add).click(function() {
            var varname=$(optim_txt_varname).val();
            var start=$(optim_txt_start).val();
            var step=$(optim_txt_step).val();
            debug_out("this is");
            debug_out(this);
            if(optim.addvar(varname,start,step)) {
                $(optim_txt_varname).val("");
                $(optim_txt_start).val("");
                $(optim_txt_step).val("");
            }
            optim_txt_varname.focus();
        });
        self.format_update = function() {
			optim_txt_req_error.val(stocsd_format(optim_optimiser.get_req_error()));
		};
        
		optim_optimiser.update=function() {
                var res=optim_optimiser.get_res();
                res.sort();         
                optim_optimiser.update_vars();
                optim.render_vartable();
                if(res.sim.length>0 && optim_optimiser.get_run_state() != "none") {
                    optim_txt_objfunc_value.val(stocsd_format(res.sim[0].raw_result));
                }
                
				if(optim_optimiser.get_run_state()=="running") {
					// We only want to update this fields while the optimiser is running
					optim_lbl_iters.val(optim_optimiser.iters);
					optim_lbl_nsim.val(optim_optimiser.nsim);
				}
                				
				if(optim_optimiser.get_tol()!=0) { // We don't want to display actual value until we have a real value
					optim_txt_actual_error.val(stocsd_format(optim_optimiser.get_tol()));
				}
                optim.update_status();
                
                if(optim_optimiser.get_run_state()=="running") {
                    optim.run_time = optim.saved_time+(get_timestamp()-optim.start_timestamp);
                } else {
                    optim.run_time = optim.saved_time;
                }
                optim_lbl_exec_time.html(format_elapsed_time(optim.run_time.toFixed(0)));
                if(optim_optimiser.get_run_state()!="none") {
					stocsd_update_time_step();
				} else {
					optim_lbl_timestep.html("");
				}
				if(optim_chk_showgui.prop("checked")==false) {
					imc_simulation_close();
				}
		};
        
        add_num_validate(optim_txt_start);
        add_custom_validate(optim_txt_start,primitivefound_validate);
        add_num_validate(optim_txt_step);
        add_custom_validate(optim_txt_step,primitivefound_validate);
        
        //add_num_validate(optim_txt_req_error);
        add_custom_validate(optim_txt_req_error,this.req_error_validate);
        
        add_int_validate(optim_txt_maxiter);
        
        add_var_validate(optim_txt_objfunc);
        add_var_validate(optim_txt_varname);
        
        // Delete button
        $(optim_btn_del).click(function() {
            varname_array=optim.selected_vars();
            for(var i in varname_array) {
                optim_optimiser.del_var(varname_array[i]);
            }
            optim.render_vartable();
        });
        
        // Optimise button
        $(optim_cmd_optimise).click(function() {
			// Input error-checking was done here before
			// But it is not any longer, since we need to collect all the data
			// Such as which variables exists before we can start checking
			// Now its in the function imc_return_handlers['optim_try_optimise']
            switch(optim_optimiser.get_run_state()) {
                case "none":
                    optim.run();
                    break;
                case "running":
                    optim_optimiser.set_run_state("halted");
                    break;
                case "halted":
					optim.resume();
                    break;
            }
        });
        
		optim_txt_req_error.change(function() {
			optim.update_req_error();
		});
        
        optim_txt_maxiter.change(function() {
            optim.update_max_iter();
        });        
		optim_txt_maxiter.keyup(function() {
            optim.update_max_iter();
        });  
        
        optim_chk_showgui.change(function() {
			optim_optimiser.show_simulations=$(this).prop("checked");
			if(($(this).prop("checked"))==false) {
				imc_simulation_close();
			}
		});
        
        optim.update_max_iter();
        
                
        // Log button
		$(optim_cmd_log).click(this.open_log);
        
        optim_chk_minimise.change(function() {
            optim_optimiser.min_max=1;
        });
        
        optim_chk_maximise.change(function() {
            optim_optimiser.min_max=-1;
        });

        optim_optimiser.console=optim_console;
        stocsd_update_current_time();        
        // Test button
        
        
		optim_optimiser.event_finished=function(){
			//alert("optim finished event");
			//imc_vars_load();
		};
            
        $(cmd_optim_test).click(function() {
            load_last_model_data();
            $(optim_txt_objfunc).val("Banana");
            $(optim_chk_minimise).prop("checked",true);
            $(optim_txt_req_error).val("0.001").change();
            $(optim_txt_varname).val("X1");
            $(optim_txt_start).val("-1");
            $(optim_txt_step).val("0.1");
            $(optim_btn_add).click();
            $(optim_txt_varname).val("X2");
            $(optim_txt_start).val("1");
            $(optim_txt_step).val("0.1");
            $(optim_btn_add).click();            
        });
        optim_cmd_reset.click(function() {
			optim.parameter_input_enable(true);
            optim_optimiser.reset();
            //imc_vars_debug();
            optim_optimiser.update();
            // This must be set after the update otherwise some fields will not be updated
            optim_optimiser.set_run_state("none");
            //imc_vars_debug();
            optim_lbl_exec_time.html("0 sec");
            optim_lbl_timestep.val("");
            optim_txt_objfunc_value.val("");
            //alert("here is the reset ends");
        });
    
        this.update_rel_abs_error();
        optim_chk_error_absolute.click(this.update_rel_abs_error);
        optim_chk_error_relative.click(this.update_rel_abs_error);
    };
    this.update_rel_abs_error=function() {
        if(optim_chk_error_absolute.prop("checked")) {
            optim_optimiser.set_error_mode("abs");
        }
        if(optim_chk_error_relative.prop("checked")) {
            optim_optimiser.set_error_mode("rel");
        }
    }

	this.resume=function() {
		this.prepare_input_check("optim_try_continue");
	}
    this.run=function() {
		this.prepare_input_check("optim_try_optimise");
    };
    
    this.prepare_input_check=function(return_handler) {
		// Create array that we must check exist
		// Get the name of the vars
        var var_array = optim_optimiser.get_vars();
        // Add the objective function to variables to test for
        var objfunc=$(optim_txt_objfunc).val();
        var_array.push(objfunc); 
        
        imc_var_array_exists(var_array,return_handler);
	};
    this.update_req_error=function() {
        var req_error=Number(optim_txt_req_error.val());
        optim_optimiser.req_error=req_error; 
        optim_txt_req_error.val(stocsd_format(req_error));
    };
    this.update_max_iter=function() {
        var max_iter=Number(optim_txt_maxiter.val());
        if(max_iter <= 0) {
            xalert_highlight("You must enter a positive number for Max Iterations", optim_txt_maxiter);
            return false;
        }
        optim_optimiser.max_iter=max_iter;  
        return true;      
    };
    this.update_status=function() {
        //optim_txt_status.val(optim.run_state);
        switch(optim_optimiser.get_run_state()) {
            case "none":
                optim_txt_status.val("");
                optim_txt_status.css("background-color","white");
                break;
            case "running":
                optim_txt_status.val("RUNNING");
                optim_txt_status.css("background-color","yellow");
                break;                
            case "halted":
                if(optim_optimiser.get_route()=="optim_finished") {
                    optim_txt_status.val("DONE");
                    optim_txt_status.css("background-color","lightgreen");
                } else {
					if(optim_optimiser.is_maxiter()) {
						optim_txt_status.val("HALTED (Max Iterations)");
					} else {
						optim_txt_status.val("HALTED");
					}
                    optim_txt_status.css("background-color","#ffb554"); // Light orange
                }
                break;                
            default:
                optim_txt_status.val(optim_optimiser.get_run_state());
        }
    };
    this.clear_all=function() {
        optim_txt_objfunc.val("");
        optim_txt_req_error.val("");
        optim_txt_varname.val("");
        optim_txt_start.val("");
        optim_txt_step.val("");
        optim_txt_actual_error.val("");
        optim_lbl_iters.val("");
        optim_txt_objfunc_value.val("");
        optim_lbl_nsim.val("");
        optim_lbl_timestep.val("");
		this.start_timestamp=null;
		this.run_time=0;
		this.saved_time=0;
		if(optim_chk_sendseed.prop("checked")) {
			optim_chk_sendseed.click();
		}
		if(optim_chk_showgui.prop("checked")) {
			optim_chk_showgui.click();
		}
		if(optim_eformat_checkbox.prop("checked")) {
			optim_eformat_checkbox.click();
		}
        self.parameter_input_enable(true);
        optim_optimiser.clear_all();
        optim_cmd_reset.click();
        this.render_vartable();
        optim_txt_maxiter.val("200");
        optim_txt_maxiter.change();
		optim_txt_req_error.val("");
		setTimeout(self.clear_all_finalize,1);
    };
    // Here we know reset is done
    self.clear_all_finalize=function() {
		optim_chk_minimise.click();
	};
	this.input_check=function(response) {
		// 1. Preparation for input check
		var objfunc=$(optim_txt_objfunc).val();
		var result = response["returnobj"].result;
		
		
		// Sanity check that the objective function is actually in the array of checked variables
		// The only way it can be not is if someone removed it just before this function started
		if(result[objfunc]==undefined) {
			alert("Internal error: Objective function is not specified");
			return false;
		}
		
		var objfunc_exists = result[objfunc];
		// Remove the objective function from the result array so it 
		// will not later be treated as a parameter in the later check
		delete result[objfunc];
		
		// 2. Start the input check
		
		// 2.1 Input check the parameters
		if(optim_optimiser.num_vars()==0) {
			optim_txt_varname.addClass("highlighted_parameter");
			optim_txt_start.addClass("highlighted_parameter");
			optim_txt_step.addClass("highlighted_parameter");
            xalert("You must first specify and Add some parameter(s).", function() {
				optim_txt_varname.focus();
				$(".highlighted_parameter").removeClass("highlighted_parameter");
			});
            return false;
        }
		for(varname in result) {
			if(result[varname]!=true) {
				$(".optim_var_row[data-varname='"+varname+"']").addClass("highlighted_parameter");
				xalert("Parameter '"+varname+"' does not exist in the model.", function() {
						$(".highlighted_parameter").removeClass("highlighted_parameter");
				});
				return false;
			}
		}
		
		// Check if we have non added parameters
		if(optim_txt_varname.val()!="") {
			xalert_highlight("The specified parameter '"+optim_txt_varname.val()+"' has not been added.", optim_txt_varname);
			return false;
		}
		
		// 2.2 Input check the objective function
		if(optim_txt_objfunc.val()=="") {
			xalert_highlight("No Objective Function is specified.", optim_txt_objfunc);
			return false;
		}
		if(!objfunc_exists) {
			xalert_highlight("The Objective Function '"+objfunc+"' does not exist in the model.",optim_txt_objfunc);
			return false;
		}
		
		if(Number(optim_txt_req_error.val())<=0) {
			xalert_highlight("You must enter Required Accuracy.",optim_txt_req_error);
			return false;
		}
		if(!$(optim_chk_minimise).prop("checked") && 
			!$(optim_chk_maximise).prop("checked")) {
			xalert("You must select Minimise or Maximise.");
			return false;
		}
		
		if(self.update_max_iter()==false) {
			return false;
		}


		
		return true;
	};
	this.modified_model_alert=function() {
		/*
		if(confirm("Optim has modified the original parameter values of the model. Save the modified model?<br/>Or press Reset before save to preserve the original model")) {
			return true;
		} else {
			return false;
		}
		*/
		xoptions("<div style='display: inline-block'>Optim has modified the original parameter values of the model.<br/><br/>\
		Save the modified model?<br/>(Or press Reset before Save to preserve the original model.)</div>",
			{
			"Cancel":function(){
					$(xoptins_reference).dialog("close");
				},
			"Save modified model":function(){
				    runline('export_model();'); 
					$(xoptins_reference).dialog("close");
				}
			}
		);
		return false;
	};
};


imc_return_handlers["optim_try_continue"] = function(response) {
	if(optim.input_check(response)==false) {
			return;
	}
	optim_optimiser.resume();
}

// Register imc handlers
// On execute validatoin
imc_return_handlers['optim_try_optimise'] = function(response) {
		if(optim.input_check(response)==false) {
			return;
		}
		
		// Start the optimisation
		optim.parameter_input_enable(false);
		
		// Store the state of the model so we can take it back on reset
		var var_list = optim_optimiser.get_vars();
		imc_vars_save(var_list);
		
		var objfunc=$(optim_txt_objfunc).val();
		optim_optimiser.set_objective_function(objfunc);
		
		if(optim_chk_error_absolute.prop("checked")) {
			optim_optimiser.error_mode="abs";
		}
		if(optim_chk_error_relative.prop("checked")) {
			optim_optimiser.error_mode="rel";
		}





		
		
		//optimise(f,[0,0],[0.1,0.1]);
		//optimise(f,[-1,1],[0.1,0.1]);
		//optimise(f,[-1,1],[0.1,0.1]);
		if(optim_chk_sendseed.prop("checked")) {
			stocsd_send_seed=Number(optim_txt_seed_value.val());
		} else {
			stocsd_send_seed=null;
		}
		stocsd_update_time_step();
		

		save_hook_array["optim_modified_model"]=optim.modified_model_alert;

		optim_optimiser.set_run_state("running");
		optim_optimiser.start();
};
imc_return_handlers['optim_try_add_var']=optim.add_var_imc_return;

function add_num_validate(field) {
    $(field).focusout(function() {
        if($(field).val()!="") {
            if(!IsNumeric($(field).val())) {
				highlight(field);
                xalert("'"+$(field).val()+"' is not a numeric value.", function() {
					unhighlight(field);
					$(field).val("");
					$(field).focus();
				});
            }
        }
    });
}

function add_custom_validate(field,validator_function) {
	$(field).focusout(function() {
		if($(field).val().trim()!="") {
			validator_function(field)
		}
	});
}

function primitivefound_validate(field) {
	if(optim_txt_varname.val()=="" && $(field).val()!="") {
		highlight(field);
		xalert("You must first specify a Param.Name.",
		function() {
			$(field).val("");
			$(field).focus();
			unhighlight(field);
		});
	}
}

function add_int_validate(field) {
    $(field).focusout(function() {
        if($(field).val()!="") {
            var input_val=$(field).val();
            if(!IsNumeric(input_val) || input_val!=parseInt(input_val)) {
                xalert("'"+$(field).val()+"' is not an integer.");
                $(field).val("");
                setTimeout(function(){$(field).focus();}, 1);
            }
        }
    });
}

tmp_var_field_to_validate=undefined;
function add_var_validate(field){
$(field).focusout(function() {
        if($(field).val()!="") {
            tmp_var_field_to_validate=field;
            imc_var_exists($(field).val(),"validate_var"); 
        }
    });
};

// On the fly validation (when focus is lost from a field)
imc_return_handlers['validate_var']=function(response) {
    if(!response.returnobj.exists) {
		var field_name = $(tmp_var_field_to_validate).attr("data-name");
        highlight(tmp_var_field_to_validate);
        xalert(field_name+" '"+response.returnobj.varname+"' does not exist.",
        function() {
			$(tmp_var_field_to_validate).val("");
			$(tmp_var_field_to_validate).focus();
			unhighlight(tmp_var_field_to_validate);
		});
    }
};

window.optim=optim;

})();
