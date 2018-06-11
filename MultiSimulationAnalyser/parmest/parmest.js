/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
var parmest=new function() {
    self=this;
    this.title="ParmVar";
    this.codename="parmest";
    this.start_timestamp=null;
    this.run_time=0;
    this.saved_time=0;
    this.rand=randclass();
    this.num_estimates=100;
    this.actual_estimate=0;
    this.estimated_finish_time=null;
	self.skiponcondition_count = 0;
	
    this.parameter_input_enable=function(enablevalue) {
		if(enablevalue) {
			parmest_param_locked_message.hide();
			parmest_param_input.prop("disabled",false);
			parmest_param_input.removeClass("disabled");
			
			parmest_txt_seed_value.prop("disabled",false);
			parmest_div_sendseed.removeClass("disabled");
			
			parmest_chk_skiponcondition.prop("disabled",  false);			
		} else {
			parmest_param_locked_message.show();
			parmest_param_input.prop("disabled",true);
			parmest_param_input.addClass("disabled");
			
			parmest_txt_seed_value.prop("disabled",true);
			parmest_div_sendseed.addClass("disabled");
			
			parmest_chk_skiponcondition.prop("disabled",  true);
		}
	}
    this.update_estimates=function() {
        parmest_txt_actual_estimate.val(this.actual_estimate);
        
        var est_total_time = (this.run_time/this.actual_estimate)*this.num_estimates;
        if(this.actual_estimate!=0) {
            this.estimated_finish_time=get_timestamp()+est_total_time-this.run_time
            parmest_lbl_est_time_left.html(format_elapsed_time(this.estimated_finish_time-get_timestamp()));
        }
    };
    parmest_optimiser.run_state_update=function(old_run_state,new_run_state) {
        // if we go from none to running
        if(old_run_state=="none" && new_run_state=="running") {
            stocsd_update_current_time();
        }

        // update run state     
        if(new_run_state=="running") {
        parmest.start_timestamp = get_timestamp();
        parmest_cmd_run.text("Halt");
            //$(".cmd_reset").show();
        }
        if(new_run_state=="halted") {
            //calc_percentiles();
            self.estimated_finish_time=null;
            parmest_cmd_run.text("Cont.");
            parmest.saved_time=parmest.run_time;
        }
        if(new_run_state=="none") {
            parmest_cmd_run.text("Run");
            parmest.saved_time=0;
        }
        if(new_run_state=="ended") {
            parmest_cmd_run.text("Run");
        }
        parmest_optimiser.update();
    }
    this.open_log=function() {
		var form_height = $(document).height()*0.8;
		var form_width = 450;
		// http://stackoverflow.com/questions/171928/hook-into-dialog-close-event
		log_form=$( "#frm_parmest_log" ).dialog({ 
			resizable: true,
											  position: 'center',
											  width: 'auto',
											  height: form_height
		});
		log_form.dialog('option', 'title', parmest.title+" Log");
		log_form.dialog('option','width', form_width);
		log_form.dialog('option','height', form_height);
	}
    
    this.show = function() {    
        debug_out("this in show");
        debug_out(this);
		setTimeout(function() {
			parmest_txt_varname.focus();
		}, 50);
    };
    
    this.gethelptext=function() {
        return $(parmest_help).html();
    };
    this.construct = function() {

    };
    this.addvar = function(varname,start,step) {
        if(varname=="") {
            xalert_highlight("You must enter the name of the variable.",parmest_txt_varname);
            return false;
        }
        

        
        if(!IsNumeric(start)) {
            xalert_highlight("You must enter a numeric start value.",parmest_txt_start);
            return false;
        }
        if(!IsNumeric(step)) {
            xalert_highlight("You must enter a numeric step value.",parmest_txt_step);
            return false;
        }
        // We start by storing this in the table.
        // Even before we checked if the variable exists in the model
        // This is becouse we need to store start and step
        // In case the variable does exist in the model
        
        
        parmest_optimiser.add_var(varname,start,step);
        debug_out("vartable");
        debug_out(parmest_optimiser.get_vartable());
        // If we past all the initial tests, we check with 
        // the model if this variable exists
        imc_var_exists(varname,"parmest_try_add_var");
        return true;
    };
    
    this.add_var_imc_return = function(response) {
        if(response.returnobj.exists==false) {
            //this.delvar(response.returnobj.varname);
            
            parmest_optimiser.del_var(response.returnobj.varname);
            parmest.render_vartable();
            xalert_highlight("The variable "+response.returnobj.varname+" does not exist in the model.", parmest_txt_objfunc);
            return;
        } else {
            parmest_analysis_table.addvar(response.returnobj.varname);
            parmest_varstats.addvar(response.returnobj.varname);
            parmest.render_vartable();
            reattach_varcheck_click();
        }
    };
    
    
    function reattach_varcheck_click() {
        parmest_container.find(".varcheckbox").unbind("click",parmest_varcheckbox_click);
        parmest_container.find(".varcheckbox").click(parmest_varcheckbox_click);
    }
    
    function parmest_varcheckbox_click() {
        var varname=$(this).attr("data-varname");
        var value=$(this).prop("checked");
        parmest_container.find(".varcheckbox").each(function() {
            if($(this).attr("data-varname")==varname) {
                $(this).prop("checked",value);
            }
        });
    }
    
    this.selected_vars = function() {
        var varname_array=[];
        $(".parmest_varcheckbox").each(function(i,checkbox) {
            if($(checkbox).is(':checked')) {
                var varname=$(checkbox).attr("data-varname");
                varname_array.push(varname);
            }
        });
        return varname_array;
    }
    
    this.render_vartable = function() {
        output="";
        var vartable=parmest_optimiser.get_vartable();
        for(var varname in vartable) {
            var varobj = vartable[varname];
            debug_out("displaying "+varname);
            output+="<tr>";
            output+="<td><input class='varcheckbox parmest_varcheckbox' data-varname='"+varobj.name+"' type='checkbox'/></td>";
            
            
            
            
            output+="<td class='alignleft varname_data col0'>"+varobj.name+"</td>";
            output+="<td class='alignright result_data col1'>&nbsp"+stocsd_format(varobj.start)+"&nbsp</td>";
            output+="<td class='alignright result_data col2'>&nbsp"+stocsd_format(varobj.step)+"&nbsp</td>";
            output+="<td class='alignright result_data col3'>&nbsp"+stocsd_format(varobj.best)+"&nbsp</td>";
            output+="<td class='alignright result_data col4'>&nbsp"+stocsd_format(varobj.span)+"&nbsp</td>";
            output+="</tr>";
        }
        $("#parmest_tbl_vars tbody").html(output);
        if(parmest_optimiser.get_run_state()!="none") {
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
        reattach_varcheck_click();
    };
    
    
    this.construct();
    // Init should be runned after the DOM is created, but before we show the parmest app
    // Init can therefor not be called as a constructor, as DOM is not already created
    
    this.update_lambda=function() {
        var conf_level=Number(parmest_txt_conf_level.val());
        var opt_sides;
        if(parmest_chk_2_sided.prop("checked")) {
            opt_sides="2";
        } else {
            opt_sides="1";        
        }
        parmest_varstats.update_lambda(conf_level,opt_sides);
        parmest_txt_lambda.html("λ: "+parmest_varstats.get_confint_lambda().toFixed(3));
    }
    
    this.init = function() {
		parmest_chk_skiponcondition.click(self.chk_skiponcondition_click);
        parmest_analysis_table.set_vartable(parmest_varstats.get_vartable());
        parmest_chk_post_analysis.change(function() {
            var visible=$(this).prop("checked");
            parmest_analysis_table.set_visible(visible);
            parmest_div_post_analysis.toggle(visible);
            /*if(visible) {
                self.render_analysis_table();
            }*/
        });
        
        parmest_txt_percentile_level.keyup(function() {
            parmest_varstats.set_percentile_level(Number($(this).val()));
        });
        parmest.update_estimates();
        parmest_btn_add.app=this;
        
        this.update_lambda();
        parmest_txt_conf_level.change(parmest.update_lambda);
        parmest_txt_conf_level.keyup(parmest.update_lambda);
        parmest_chk_1_sided.click(parmest.update_lambda);
        parmest_chk_2_sided.click(parmest.update_lambda);
        // Add button
        $(parmest_btn_add).click(function() {
            var varname=$(parmest_txt_varname).val();
            var start=$(parmest_txt_start).val();
            var step=$(parmest_txt_step).val();
            debug_out("this is");
            debug_out(this);
            if(parmest.addvar(varname,start,step)) {
                $(parmest_txt_varname).val("");
                $(parmest_txt_start).val("");
                $(parmest_txt_step).val("");
            }
            parmest_txt_varname.focus();
        });
        add_num_validate(parmest_txt_start);
        add_num_validate(parmest_txt_step);
        add_num_validate(parmest_txt_req_error);
        add_int_validate(parmest_txt_maxiter);
        
        add_var_validate(parmest_txt_objfunc);
        add_var_validate(parmest_txt_varname);
        
        // Delete button
        $(parmest_btn_del).click(function() {
            varname_array=parmest.selected_vars();
            for(var i in varname_array) {
                parmest_analysis_table.delvar(varname_array[i]);
                parmest_varstats.delvar(varname_array[i]);
                parmest_optimiser.del_var(varname_array[i]);
            }
            parmest.render_vartable();
        });
        parmest_txt_num_estimates.keypress(function(event) {
            floatvalidate(event);
        });
        function floatvalidate(event) {
            keyvalidate(event,"0123456789,.Ee+-");
        };
        function intvalidate(event) {
            keyvalidate(event,"012345678");
        };
        function keyvalidate(event,allowed_chars) {
            var allowed_keycodes=[8,0];
            for(i=0;i<allowed_chars.length;i++) {
                allowed_keycodes.push(allowed_chars.charCodeAt(i));
            };
            var key=event.which;
            if(allowed_keycodes.indexOf(key)==-1) {
                event.preventDefault();
            }
        }
        parmest_txt_num_estimates.keyup(function() {
            self.num_estimates=Number($(this).val());
            self.update_status();
            self.update_estimates();
        });// Optimise button
        parmest_cmd_run.click(function() {
            stocsd_update_time_step();
            switch(parmest_optimiser.get_run_state()) {
                case "none":
                    self.run();
                    break;
                case "running":
                    parmest_optimiser.set_run_state("halted");
                    break;
                case "halted":
					if(self.actual_estimate>=self.num_estimates) {
						xalert("No more estimates to do.");
						return;
					}
                    if(parmest_optimiser.get_route()=="optim_finished") {
                        parmest_optimiser.start();
                    } else {
                        parmest_optimiser.resume();
                    }
                    break;
            }
        });
        parmest_txt_req_error.change(function() {
            parmest.update_req_error();
        });
        
        parmest_txt_maxiter.change(function() {
            parmest.update_max_iter();
        });
        
		parmest_txt_maxiter.keyup(function() {
            parmest.update_max_iter();
        });  
        parmest_cmd_export_log.click(function() {
            export_txt("log.txt",html_to_txt(parmest_console.html()));
        });
        
        parmest.update_max_iter();
        
                
        // Log button
		parmest_cmd_log.click(this.open_log);
        

        parmest_optimiser.console=parmest_console;
        parmest_optimiser.min_max=1;

        stocsd_update_current_time();        
        parmest_optimiser.event_finished=function() {
            var result=parmest_optimiser.get_best();            
            parmest_varstats.new_values(result);
            parmest_analysis_table.update();
            
            self.actual_estimate++;
            self.update_estimates();
            parmest_scatterplot.try_update();
            
            parmest_histogram.try_update();
            
            if(self.actual_estimate>=self.num_estimates) {
                self.estimated_finish_time=null;
                parmest_optimiser.reset();
                parmest_optimiser.update();
                return;
            }
			//~ alert("Event finished");
            self.run_next_optimisation();
        };
        
        parmest_optimiser.event_skiponcondition_test=function(skiponcondition_exists, skiponcondition_value) {
			if(parmest_chk_skiponcondition.prop("checked")==false) {
				// We don't do anything here if SkipOnCondition is not requested
				return true;
			}
			if(skiponcondition_exists==false) {
				alert("Error! skiponcondition does not exist but was requested");
				return false;
			}
			//~ alert(skiponcondition_value);
			if(skiponcondition_value>0) {
				self.skiponcondition_count++;
				update_skiponcondition();

				//alert(parmest_optimiser.get_route());
				//~ parmest_cmd_export_txt.click();
				//~ alert();
				

				

				parmest_optimiser.reset();
				parmest_optimiser.reset_complete();
				parmest_optimiser.update();
				// This must be set after the update otherwise some fields will not be updated
				parmest_optimiser.set_run_state("none");
				


				//~ alert("finished")
				
				self.run_next_optimisation();
				//~ alert("p ostfinished");
				
				
				return false;
			}
			return true;
		};
        
        parmest_optimiser.event_before_run=function() {
            //alert("before run");
        };

        cmd_parmest_test.click(function() {
            load_last_model_data();
            $(parmest_txt_objfunc).val("Banana");
            //$(parmest_txt_req_error).val("0.001").change();
            $(parmest_txt_req_error).val("0.001").change();
            $(parmest_txt_varname).val("X1");
            //$(parmest_txt_start).val("-1");
            $(parmest_txt_start).val("0.9");
            $(parmest_txt_step).val("0.1");
            $(parmest_btn_add).click();
            $(parmest_txt_varname).val("X2");
            $(parmest_txt_start).val("1");
            $(parmest_txt_step).val("0.1");
            $(parmest_btn_add).click();            
        });
        parmest_cmd_reset.click(function() {
			self.skiponcondition_count = 0;
			update_skiponcondition();
            self.estimated_finish_time=null;
            self.actual_estimate=0;
            self.update_estimates();
            parmest_varstats.reset_all_vars();
            parmest_optimiser.reset();
            parmest_optimiser.update();
			// This must be set after the update otherwise some fields will not be updated
			parmest_optimiser.set_run_state("none");
            parmest_txt_objfunc_value.val("");
            parmest_txt_actual_error.val("");
            parmest_txt_seed_actual.val("");
			self.parameter_input_enable(true);
        });
        parmest_cmd_export_txt.click(function() {
            var do_sort=parmest_do_sort.prop("checked");
            var dataset=vars_to_dataset(parmest_varstats);
            if(do_sort) {
                var sortvar = parmest_varstats.single_selectedvar();
                if(sortvar != null) {
                    sortdataset(dataset,sortvar);
                } else {
                    xalert("Exactly one variable must be selected.");
                    return;
                }
            }
            export_txt("export.txt",dataset_tostring(dataset));
        });
        parmest_cmd_scatterplot.click(function() {
            var selected_vars=parmest_varstats.multi_selectedvar();
            if(selected_vars.length!=2) {
                xalert("You must select exactly two variables.");
            } else {
                parmest_scatterplot.set_vartable(parmest_varstats.get_vartable());
                parmest_scatterplot.set_varnames(selected_vars[0],selected_vars[1]);
                parmest_scatterplot.frm_scatterplot_load();
            }
        }); 
        parmest_cmd_histogram.click(function() {
            var histovar = parmest_varstats.single_selectedvar();
            if(histovar == null) {
                xalert("Exactly one variable must be selected.");
                return;
            }
            
            var vartable=parmest_varstats.get_vartable();
            debug_out(vartable);
            parmest_histogram.set_vartable(parmest_varstats.get_vartable());
            parmest_histogram.set_varname(histovar);
            parmest_histogram.frm_histogram_load();
            
            //alert("Histograms are not implemented yet");
        });
        this.update_rel_abs_error();
        parmest_chk_error_absolute.click(this.update_rel_abs_error);
        parmest_chk_error_relative.click(this.update_rel_abs_error);
		parmest_chk_showgui.change(function() {
				parmest_optimiser.show_simulations = parmest_chk_showgui.prop("checked");
		});
    };
    

    
    this.update_rel_abs_error=function() {
        if(parmest_chk_error_absolute.prop("checked")) {
            /*alert("hoj");*/
            parmest_optimiser.set_error_mode("abs");
        }
        if(parmest_chk_error_relative.prop("checked")) {
            /*alert("haj");*/
            parmest_optimiser.set_error_mode("rel");
        }
    }
    
    self.run=function() {
		this.prepare_input_check();
    };
    
	this.prepare_input_check=function() {
		// Create array that we must check exist
		// Get the name of the vars
        var var_array = parmest_optimiser.get_vars();
        // Add the objective function to variables to test for
		var objfunc=parmest_txt_objfunc.val();
        var_array.push(objfunc); 
        
        if(parmest_chk_skiponcondition.prop("checked")==true) {
			var_array.push("SkipOnCondition"); 
		}
        imc_var_array_exists(var_array,"parmest_input_check");
	};
	
	parmest_optimiser.update=function() {
			var res=parmest_optimiser.get_res();
			res.sort();
			parmest_optimiser.update_vars();
			parmest.render_vartable();
			if(res.sim.length>0) {
				parmest_txt_objfunc_value.val(stocsd_format(res.sim[0].raw_result));
			}
			
			if(parmest_optimiser.get_run_state()=="running") {
				// We only want to update this fields while the optimiser is running	
				parmest_lbl_iters.val(parmest_optimiser.iters);
				parmest_lbl_nsim.val(parmest_optimiser.nsim);
			}
			parmest_txt_actual_error.val(stocsd_format(parmest_optimiser.get_tol()));
			parmest.update_status();
			
			if(parmest_optimiser.get_run_state()=="running") {
				parmest.run_time = parmest.saved_time+(get_timestamp()-parmest.start_timestamp);
			} else {
				parmest.run_time = parmest.saved_time;
			}
			
			if(self.estimated_finish_time!=null) {
				parmest_lbl_est_time_left.html(format_elapsed_time(self.estimated_finish_time-get_timestamp()));
			} else {
				parmest_lbl_est_time_left.html("");
			}
			
			parmest_lbl_exec_time.html(format_elapsed_time(parmest.run_time));
			//parmest.update_req_error();
	};
    
    this.parmestise_imc_return = function(response) {
		log = "";
        if(response.returnobj.exists==false) {
            xalert_highlight("The objective function "+response.returnobj.varname+" does not exist in the model.",parmest_txt_objfunc);
            return;
        } else {
            parmest_optimiser.set_objective_function(response.returnobj.varname);
            
            


            







            
            
			//parmestise(f,[0,0],[0.1,0.1]);
            //parmestise(f,[-1,1],[0.1,0.1]);
            //parmestise(f,[-1,1],[0.1,0.1]);
            rand.setseed(Number(parmest_txt_seed_value.val()));
            
            parmest.run_next_optimisation();
        }
    };
    this.run_next_optimisation=function() {
        parmest_optimiser.reset();
        var actual=rand.next();
        parmest_txt_seed_actual.val(actual);
        var seed_name=parmest_txt_seed_name.val();
        //im_set_var(seed_name,actual);
        stocsd_send_seed=actual;
        
        parmest_optimiser.set_run_state("running");
        parmest_optimiser.start();
    };
    this.update_req_error=function() {
        var req_error=Number(parmest_txt_req_error.val());
        if(req_error <= 0) {
            xalert_highlight("You must enter a positive number for Required Accuracy.",parmest_txt_req_error);
            return false;
        }
        parmest_optimiser.req_error=req_error; 
        parmest_txt_req_error.val(stocsd_format(req_error));
        return true;
    };
    this.update_max_iter=function() {
        var max_iter=Number(parmest_txt_maxiter.val());
        if(max_iter <= 0) {
            xalert_highlight("You must enter a positive number for Max Iterations.",parmest_txt_maxiter);
            return false;
        }
        parmest_optimiser.max_iter=max_iter;  
        return true;      
    };
    self.update_seed_of_seeds=function() {
		var seed_of_seeds=Number(parmest_txt_seed_value.val());
        if(seed_of_seeds <= 0) {
            xalert_highlight("You must enter a positive number for Seed-of-Seeds.",parmest_txt_seed_value);
            return false;
        }
        //parmest_optimiser.max_iter=max_iter;  
        return true;   	
	};
    this.update_status=function() {
        //parmest_txt_status.val(parmest.run_state);
        switch(parmest_optimiser.get_run_state()) {
            case "none":
            
            
            
            
                parmest_txt_status.val("");
                parmest_txt_status.css("background-color",color_none);
                break;
            case "running":
                parmest_txt_status.val("RUNNING");
                parmest_txt_status.css("background-color",color_running);
                break;                
            case "halted":
                if(self.actual_estimate>=self.num_estimates) {
                //if(parmest_optimiser.get_route()=="parmest_finished") {
                    parmest_txt_status.val("DONE");
                    parmest_txt_status.css("background-color",color_done);
                } else {
                    if(parmest_optimiser.is_maxiter()) {
						parmest_txt_status.val("HALTED (Max Iterations)");
					} else {
						parmest_txt_status.val("HALTED");
					}
                    parmest_txt_status.css("background-color",color_halted); // Light orange
                }
                break;                
            default:
                parmest_txt_status.val(parmest_optimiser.get_run_state());
        }
    };
    self.clear_all=function() {
		parmest_cmd_reset.click();
		setTimeout(self.clear_all_finalize, 1);
    };
    self.clear_all_finalize = function() {
		parmest_txt_objfunc.val("");
        parmest_txt_req_error.val("");
        parmest_txt_varname.val("");
        parmest_txt_start.val("");
        parmest_txt_step.val("");
        parmest_txt_seed_value.val("123");
        parmest_txt_seed_actual.val("");
        parmest_txt_actual_error.val("");
        parmest_txt_actual_estimate.val("0");
        parmest_lbl_iters.val("0");
        parmest_lbl_nsim.val("0");
        parmest_txt_maxiter.val("200"); 
        parmest_txt_objfunc_value.val("");
        parmest_optimiser.clear_vars();
        self.render_vartable();
        parmest_optimiser.objective_function=null;
        parmest_varstats.clear_all_vars();
        parmest_txt_num_estimates.val("100");
        parmest_txt_conf_level.val("95");
        parmest_txt_percentile_level.val("50");
        parmest_txt_freetext.val("");
        parmest_lbl_exec_time.val("0 sec");
        parmest_lbl_est_time_left.val("0 sec");
        parmest_lbl_timestep.val("");
        if(parmest_chk_2_sided.prop("checked")) {
			parmest_chk_2_sided.click();
		}
		if(parmest_do_sort.prop("checked")) {
			parmest_do_sort.click();
		}
		if(parmest_chk_post_analysis.prop("checked")) {
			parmest_chk_post_analysis.click();
		}
	};
	
	function update_skiponcondition() {
		if(parmest_chk_skiponcondition.prop("checked")) {
			parmest_txt_skiponcondition_info.html("(Skipped runs = "+self.skiponcondition_count+")");
		} else {
			parmest_txt_skiponcondition_info.html("");
		}
	}
	
	self.chk_skiponcondition_click=function() {
		if(parmest_chk_skiponcondition.prop("checked")==true) {
			// We will only allow this if skiponcondition exists
			parmest_chk_skiponcondition.prop("checked",false);
			imc_var_exists("skiponcondition", "parmest_skiponcondition_exists_return");
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
			parmest_chk_skiponcondition.prop("checked",false);
			update_skiponcondition();
		} else {
			// If skiponcondition was in the model
			parmest_chk_skiponcondition.prop("checked",true);
			update_skiponcondition();
		}
	};
};

// Register imc handlers


imc_return_handlers["parmest_skiponcondition_exists_return"]=parmest.skiponcondition_exists_return;



// On execute validatoin
imc_return_handlers['parmest_try_parmestise']=function(response) {
    parmest.parmestise_imc_return(response);
};
imc_return_handlers['parmest_try_add_var']=function(response) {
    parmest.add_var_imc_return(response);
};

function add_num_validate(field) {
    $(field).focusout(function() {
        if($(field).val()!="") {
            if(!IsNumeric($(field).val())) {
                xalert_highlight($(field).val()+" is not a numeric value.",field);
                $(field).val("");
                setTimeout(function(){$(field).focus();}, 1);
            }
        }
    });
}

function add_int_validate(field) {
    $(field).focusout(function() {
        if($(field).val()!="") {
            var input_val=$(field).val();
            if(!IsNumeric(input_val) || input_val!=parseInt(input_val)) {
                xalert_highlight($(field).val()+" is not an integer.",field);
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
        xalert_highlight(response.returnobj.varname+" does not exists.", tmp_var_field_to_validate);
        $(tmp_var_field_to_validate).val("");
        $(tmp_var_field_to_validate).focus();
    }
};

imc_return_handlers["parmest_input_check"] = function(response) {
        var objfunc=$(parmest_txt_objfunc).val();
        
       
		if(response.returnobj.result["SkipOnCondition"]==false) {
				xalert("To use SkipOnCondition there must be a variable with the name 'SkipOnCondition' in the model.");
				return;
		}
		
		
		
		  
        if(parmest_optimiser.num_vars()==0) {
			parmest_txt_varname.addClass("highlighted_parameter");
			parmest_txt_start.addClass("highlighted_parameter");
			parmest_txt_step.addClass("highlighted_parameter");
            xalert("You must first specify and Add some parameter(s).", function() {
				parmest_txt_varname.focus();
				$(".highlighted_parameter").removeClass("highlighted_parameter");	
			});
            return;
        }
        
		// Check if we have non added parameters
		if(parmest_txt_varname.val()!="") {
			xalert_highlight("The specified parameter '"+parmest_txt_varname.val()+"' has not been added.", parmest_txt_varname);
			return false;
		}
        
		// 2.2 Input check the objective function
		if(parmest_txt_objfunc.val()=="") {
			xalert_highlight("No Objective Function is specified.",parmest_txt_objfunc);
			return false;
		}
        
        
        if(parmest.update_req_error()==false) {
            return;
        }
        
		if(parmest.update_max_iter()==false) {
			return;
		}
		
		self.num_estimates=parmest_txt_num_estimates.val();
		if(self.num_estimates == 0) {
			xalert_highlight("No Estimates are Requested.",parmest_txt_num_estimates);
			return;
		}
		
		if(parmest.update_seed_of_seeds() == false) {
			return;
		}
        
        // Start optimisation
        parmest.parameter_input_enable(false);
        imc_var_exists(objfunc,"parmest_try_parmestise");
};

// Register imc handlers
// On execute validatoin
imc_return_handlers['parmest_try_optimise'] = function(response) {
		alert("Here we try to optimise");
		return;
		if(optim.input_check(response)==false) {
			return;
		}
};

function export_debug() {
	export_txt("debug.txt",log);
}
