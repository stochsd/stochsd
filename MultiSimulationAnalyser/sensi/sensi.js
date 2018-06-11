/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
/*
 * Highlevel description
 * 
 * 1. Sensi starts with running a "first run"
 * which is without changing the parameters
 * 
 * 2. Then it changes the parameters one by one
 * And sees how this affects the Objective function
 * 
 * The first step is
 * imc_return_handlers["sensi_run_model_first"]
 * The second step is handled by
 * imc_return_handlers["sensi_run_model_var"]
 * Which happens several times
 */

var sensi=new function() {
	var self = this;
    var start_timestamp=null;
    var status="none";
    self.title="Sensi";
    self.codename="sensi";
    var var_queue;
    var first_run={};
    var current_varname;
    self.show_simulations=false;
    
	
	self.parameter_input_enable=function(enablevalue) {
		if(enablevalue) {
			sensi_param_locked_message.hide();
			sensi_param_input.prop("disabled",false);
			sensi_param_input.removeClass("disabled");
			
			sensi_div_sendseed.prop("disabled",false);
			sensi_div_sendseed.removeClass("disabled");
			
			sensi_div_sensitivity.prop("disabled",false);
			sensi_div_sensitivity.removeClass("disabled");
		} else {
			sensi_param_locked_message.show();
			sensi_param_input.prop("disabled",true);
			sensi_param_input.addClass("disabled");
			
			sensi_div_sendseed.prop("disabled",true);
			sensi_div_sendseed.addClass("disabled");
			
			sensi_div_sensitivity.prop("disabled",true);
			sensi_div_sensitivity.addClass("disabled");
		}
	}
	self.get_status = function() {
		return status;
	};
    self.set_status=function(new_status) {
        status=new_status;
        sensi_txt_status.css("background-color",status_color[status]);
        sensi_txt_status.val(status_display[status]);
    };
    
	self.toggle_sendseed=function() {
		if(sensi_chk_sendseed.prop("checked")) {
			self.reset_seed();
			sensi_div_sendseed.css("visibility",  "visible");
		} else {
			sensi_div_sendseed.css("visibility",  "hidden");
		}
	}
    
	self.update_rand_seed=function() {
		if(!sensi_chk_sendseed.prop("checked")) {
			stocsd_send_seed=null;
			return;
		}
		stocsd_send_seed = rand.next();
		sensi_txt_seed_actual.val(stocsd_send_seed);
	}
    
    function update_rel_abs_mode() {
        if(sensi_chk_absolute.prop("checked")) {
            sensi_table.set_mode("abs");
        }
        if(sensi_chk_relative.prop("checked")) {
            sensi_table.set_mode("rel");
        }
    }
    
    self.show = function() {    
		setTimeout(function() {
			sensi_txt_varname.focus();
		}, 50);
    };
    
    
    self.run_next_queue=function() {
		self.update_time();
        var key;
        for(key in var_queue) {
            break;
        }
        if(key===undefined) {
            self.set_status("done");
            self.parameter_input_enable(true);
            return;
        }
        var inputs=sensi_table.get_base_values();
        inputs[key]+=var_queue[key].increment;
        current_varname=key;
        delete var_queue[key];
        if(self.show_simulations) {
			setTimeout(function() {
				imc_run_model(inputs,sensi_table.get_objectives(),self.show_simulations,"sensi_run_model_var");
			}, 500);
        } else {
				imc_run_model(inputs,sensi_table.get_objectives(),self.show_simulations,"sensi_run_model_var");
		}
    };
    self.update_time = function() {
		var run_time=(get_timestamp()-start_timestamp);
		sensi_lbl_exec_time.html(format_elapsed_time(run_time));
	};
    self.run_model_first_imc_return=function(obj) {
        sensi_table.set_first_run(obj.returnobj.variable);
        self.run_next_queue();
    };
    self.run_model_var_imc_return=function(obj) {
        sensi_table.update_variable(current_varname,obj.returnobj.variable);        
        self.run_next_queue();
    };
    self.reset_seed = function() {
		stocsd_send_seed=null;
		sensi_txt_seed_actual.val("");
		rand.setseed(sensi_txt_seed_value.val());
	};
    self.init=function() {        
        sensi_chk_sendseed.change(function() {
            self.toggle_sendseed();
        });
		sensi_txt_seed_value.change(function() {
			self.reset_seed();
		});
        self.toggle_sendseed();
        update_rel_abs_mode();
        sensi_chk_absolute.click(update_rel_abs_mode);
        sensi_chk_relative.click(update_rel_abs_mode);
        sensi_table.update();
        sensi_cmd_run.click(function() {
            self.run();
        });
        
        self.input_check = function() {
			if(sensi_table.get_vars().length==0) {
				highlight(sensi_txt_varname);
				highlight(sensi_txt_value);
				highlight(sensi_txt_increment);
				xalert("You must first specify and Add some Parameter(s).", function() {
					unhighlight_all();
					sensi_txt_varname.focus();
				});
				return false;
			}
			
			// Check if we have non added parameters
			if(sensi_txt_varname.val()!="") {
				xalert_highlight("The specified parameter '"+sensi_txt_varname.val()+"' has not been added.", sensi_txt_varname);
				return false;
			}
			
            if(sensi_table.get_objectives().length==0) {
				xalert_highlight("You must first specify and Add some Objective Functions(s).", sensi_txt_objfunc);
				return false;
			}
			
			// Check if we have non added objective functions
			if(sensi_txt_objfunc.val()!="") {
				xalert_highlight("The specified objective function '"+sensi_txt_objfunc.val()+"' has not been added.", sensi_txt_objfunc);
				return false;
			}
			
			
			
			
				
						
			return true;
		};
        
        self.run = function() {
			if(self.get_status()=="running") {
                return;
            }
            if(self.input_check()==false) {
				return;
			}
            
			stocsd_update_current_time();
			stocsd_update_time_step();
			
			self.parameter_input_enable(false);
			
			sensi.update_rand_seed();
			
			
			self.set_status("running");
            var_queue=$.extend({},sensi_table.get_vartable());
            start_timestamp = get_timestamp();
            self.update_time();
            imc_run_model(sensi_table.get_base_values(),sensi_table.get_objectives(),self.show_simulations,"sensi_run_model_first");
		};

        sensi_btn_obj_add.click(function() {
			if(sensi_txt_objfunc.val()=="") {
				xalert_highlight("You must enter a Objective Function.", sensi_txt_objfunc);
				return false;
			}
			
			
            var objname=sensi_txt_objfunc.val();
            imc_var_exists(objname,"sensi_try_add_obj");
        });
        sensi_btn_var_add.click(function() {
			if(sensi_txt_varname.val()=="") {
				xalert_highlight("You must enter a Param. Name.", sensi_txt_varname);
				return false;
			}
			

			
			if(!IsNumeric(sensi_txt_value.val())) {
				xalert_highlight("You must enter a Value.",sensi_txt_value);
				return false;
			}
			if(!IsNumeric(sensi_txt_increment.val())) {
				xalert_highlight("You must enter an Increment.",sensi_txt_increment);
				return false;
			}


			if(Number(sensi_txt_increment.val())==0) {
				xalert_highlight("Increment must be non-zero.",sensi_txt_increment);
				return false;
			}
			
            var varname=sensi_txt_varname.val();
            imc_var_exists(varname,"sensi_try_add_var");
        });
        sensi_cmd_delete.click(function() {
            sensi_table.delete_selected();
            sensi_table.update();
        });
        sensi_cmd_load.click(function() {
            load_last_model_data();
            sensi_txt_objfunc.val("Out1");
            sensi_btn_obj_add.click();
            sensi_txt_objfunc.val("Out2");
            sensi_btn_obj_add.click();
            sensi_txt_varname.val("A");
            sensi_txt_value.val("1");
            sensi_txt_increment.val("0.1");
            sensi_btn_var_add.click();
            setTimeout(function() {
                sensi_txt_varname.val("B");
                sensi_txt_value.val("1");
                sensi_txt_increment.val("0.1");
                sensi_btn_var_add.click();
            },1000);
        });
		sensi_chk_sendseed.change(function() {
			self.toggle_sendseed();
		});
		self.toggle_sendseed();
		sensi_cmd_reset.click(function() {
			start_timestamp = get_timestamp();
            self.update_time();
			sensi_table.reset();
			self.reset_seed();
		});
    
		sensi_chk_showgui.change(function() {
			self.show_simulations=$(this).prop("checked");
		});
		
		
		add_num_validate(sensi_txt_value);
        add_num_validate(sensi_txt_increment);
        
        add_var_validate(sensi_txt_varname);
        add_var_validate(sensi_txt_objfunc);
        
        
		$(sensi_txt_increment).focusout(function() {
			if(sensi_txt_increment.val()!="" && Number(sensi_txt_increment.val())==0) {
				xalert_highlight("Increment must be non-zero.",sensi_txt_increment, function(){
					sensi_txt_increment.val("");
				});
				return false;
			}
		});
    };
    
    self.add_var_imc_return = function(response) {
        if(response.returnobj.exists==false) {
            //this.delvar(response.returnobj.varname);
            xalert_highlight("Param.Name '"+response.returnobj.varname+"' does not exist.",sensi_txt_varname);
            return;
        } else {
            var value=Number(sensi_txt_value.val());
            var increment=Number(sensi_txt_increment.val());
            sensi_table.addvar(response.returnobj.varname,value,increment);
            sensi_table.update();
            sensi_txt_varname.val("");
            sensi_txt_value.val("");
            sensi_txt_increment.val("");
            sensi_txt_varname.focus();
        }
    };
    self.add_obj_imc_return = function(response) {
        if(response.returnobj.exists==false) {
            //this.delvar(response.returnobj.varname);
            xalert_highlight("Objective Function '"+response.returnobj.varname+"' does not exist.",sensi_txt_objfunc);
            return;
        } else {
            sensi_table.addobj(response.returnobj.varname);
            sensi_table.update();
            sensi_txt_objfunc.val("");
            sensi_txt_objfunc.focus();
        }
    };
    self.clear_all = function() {
		sensi_lbl_exec_time.html("0 sec");
		sensi_table.clear_all();
		
		sensi_txt_varname.val("");
		sensi_txt_value.val("");
		sensi_txt_increment.val("");
		sensi_txt_objfunc.val("");
		if(sensi_chk_showgui.prop("checked")==true) {
			sensi_chk_showgui.click();
		}
		if(sensi_chk_sendseed.prop("checked")==true) {
			sensi_chk_sendseed.click();
		}
		sensi_txt_seed_value.val("123");
		if(sensi_chk_absolute.prop("checked")==false) {
			sensi_chk_absolute.click();
		}
		sensi.set_status("none");
	};
};

imc_return_handlers['sensi_try_add_obj']=sensi.add_obj_imc_return;
imc_return_handlers['sensi_try_add_var']=sensi.add_var_imc_return;
imc_return_handlers["sensi_run_model_first"]=sensi.run_model_first_imc_return;
imc_return_handlers["sensi_run_model_var"]=sensi.run_model_var_imc_return;
