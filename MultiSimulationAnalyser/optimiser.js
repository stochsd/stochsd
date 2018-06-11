/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
// This code is a simplex optimiser of Nelder Mead type based
// on the wikipedia article:
// https://en.wikipedia.org/wiki/Nelder%E2%80%93Mead_method
//
// Reduction is renamed to shrink, to avoid having both reflection 
// And reduction start with the same letter
//
// The break condition is taken from the amoeba rutine in 
// Chapter 10 of Numerical Recipes by 
// W.H. Press, S.A. Teukolsky, W.T. Vetterling, B.P. Flannery
//
// Steps involved:
// Reflection
// Expansion
// Contraction
// Shrink
"use strict";
var decimals=6;

var optimiser_var = function(name,start,step) {
	this.name=name;
	this.start=Number(start);
	this.step=Number(step);
	this.best=0;
	this.span=0;
}

var optimiserclass=function () {
	var self=this;
    var run_state="none";
    var vartable={};
    var escore=undefined;
    var bestsimulation=undefined;
    var cscore=undefined;
    var x0=undefined;
    var rscore=undefined;
    var tol=0;
    var worst=undefined;
    var error_mode=undefined;
    var no_improve=undefined;
    var prev_best=undefined;
    var best=undefined;
    var objective_function=undefined;
    var current_sim=null;
    var tmp_sim={};
    var f=undefined;
    var start=undefined;
    var step=undefined;
    var res=undefined;

    var param_name=[];
    var route="none";
	self.show_simulations=false;
	
	this.get_error_mode=function() {
		return error_mode;
	};
	this.set_error_mode=function(new_error_mode) {
		error_mode=new_error_mode;
	};
	this.console=null;
	this.get_best=function() {
		var result={};
		for(var varname in vartable) {
			result[varname]=vartable[varname].best;
		}
		return result;
	};
	// True means everything is ok. Continue as usual
	// False means we encountered a skip
	this.event_skiponcondition_test=function(skiponcondition_exists, skiponcondition_value) {
		 //alert("Skip on condition test "+skiponcondition_exists+" "+skiponcondition_value);
		// override this
		// Returns true by default if not overriden
		
		return true;
	};
	this.event_finished=function() {
		// override this
	};
	this.event_before_run=function() {
		// override this
	};
	this.run_state_update=function(old_run_state,new_run_state) {
		// override this
	};
	this.get_run_state=function() {
		return run_state;
	}
	this.set_run_state=function(new_run_state) {
		var old_run_state=run_state;
		run_state=new_run_state;
		self.run_state_update(old_run_state,new_run_state);
	}    
	this.add_var=function(name,start,step) {
		vartable[name.toUpperCase()]=new optimiser_var(name,start,step);
	};
	this.del_var=function(varname) {
		delete vartable[varname.toUpperCase()];
	};
	this.get_vars=function() {
		return Object.keys(vartable);
	}
	this.num_vars=function() {
		return Object.keys(vartable).length;
	}
	this.var_exists=function(varname) {
		if(vartable[varname.toUpperCase()]!=undefined) {
			return true;
		} else {
			return false;
		}
	};
	this.clear_vars=function() {
		vartable={};
	};
	this.get_vartable=function() {
		return vartable;
	};
	this.get_param_names=function() {
		return param_name;
	};
	this.max_iter=-1;
	this.req_error=null;
	this.iters;
	this.nsim;
	this.set_objective_function=function(new_objective_function) {
		objective_function=new_objective_function;
	};
	// min_max should be
	// 1 for minimize (default)
	// -1 for maxmimize
	this.get_route=function() {
		return route;
	};
	this.get_res=function() {
		return res;
	};
	this.get_tol=function() {
		return tol;
	};
	this.get_req_error=function() {
		return self.req_error;
	};
	this.min_max=1;
	this.update=function() {
		// Callback on every iteration
	};
	this.reset=function() {
		tol = null;
		this.iters=0;
		this.nsim=0;
	};
	this.reset_complete = function() {
		//run_state="none";
		escore=undefined;
		bestsimulation=undefined;
		cscore=undefined;
		x0=undefined;
		rscore=undefined;
		worst=undefined;
		prev_best=undefined;
		best=undefined;
		current_sim=null;
		tmp_sim={};
		f=undefined;
		start=undefined;
		step=undefined;
		res = new resultset();
		route="none";
		//route="none";
	};
	this.update_vars=function() {
		if(res.sim.length>0 && Object.keys(vartable).length>0) {
			for(var i=0; i<param_name.length;i++) {
				vartable[param_name[i].toUpperCase()].best=res.sim[0].inputs[i];
				vartable[param_name[i].toUpperCase()].span=res.span(i);
			}
		}
	};
	this.reset();
	this.start=function() {
		//this.clear_all();
		tmp_sim={}
		res = new resultset();
		var tstart=[];
		var tstep=[];
		var i=0;
		for(var key in vartable) {
			tstart[i]=(vartable[key].start);
			tstep[i]=(vartable[key].step);
			param_name[i]=key;
			i++;
		}
		start = tstart;
		step = tstep;
		out("");
		out("New optimisation");
		out("================");
		//alert("starting new optim");
		route="optim_init";
		this.set_run_state("running");
		simplex_adviser();  
	};
	this.resume=function() {
		//alert("in resume");
		if(self.iters<self.max_iter && run_state!="running") {
			//alert("resuming");
			if(route=="optim_finished"||route=="optim_halted") {
				route="optim_loop_start";
			}
			self.set_run_state("running");
			fill_promises();
		}
	};
	this.return_handler=null;
	this.is_maxiter = function() {
		return self.iters==self.max_iter;
	};
	
	this.clear_all=function() {
		//run_state="none";
		escore=undefined;
		bestsimulation=undefined;
		cscore=undefined;
		x0=undefined;
		rscore=undefined;
		tol=0;
		worst=undefined;
		prev_best=undefined;
		best=undefined;
		current_sim=null;
		tmp_sim={};
		f=undefined;
		start=undefined;
		step=undefined;
		res = new resultset();
		this.clear_vars();
		param_name=[];
		this.objective_function=null;
		route="none";
		//route="none";
	}
	
	// Simulation : holds one single simulation
	// f : the function we use for simulation
	// input : the values x0.. xn for this simulation
	var simulation = function(inputs) {
        this.calculated=false;
        this.inputs=inputs;
        // Result used for calculations (can be be inverted or not)
        this.result=0;
        // Result of the calculation (without min max applied)
        this.raw_result=0;
		// To string : makes simulation human readable
		this.toString=function() {
            var out="";
            out+=this.calculated+" ";
            out+=array_to_string(this.inputs);
			out+=" = ";
			out+=this.raw_result.toFixed(decimals);
            return out;
		}; // End toString
        
        
        
        
	} // End simulation
	
	// Holds a set of simulations
	var resultset = function() {		
		this.sim = [];
		this.dim=0;
		
        this.span=function(dimension) {
            // Until we know better we assume the first sim[0] is the biggest and smallest
            var smallest=this.sim[0].inputs[dimension];
            var biggest = this.sim[0].inputs[dimension];
            // We go through the other sims and see if one is better
            for(var i=1;i<this.sim.length;i++) {
                var current_value=this.sim[i].inputs[dimension];
                if(current_value<smallest) {
                    smallest=current_value;
                }
                if(current_value>biggest) {
                    biggest=current_value;
                }
            }
            return biggest-smallest;
        }
        
		this.sort=function() {
			this.sim.sort(function(a,b) {
				if(a.result<b.result) {
					return -1;
				} else if (a.result>b.result) {
					return 1;
				} else {
					return 0;
				}
			});
		} // End sort
		
		this.replaceworst_sim=function(newsimulation) {
			this.sort();
			this.sim[this.sim.length-1]=newsimulation;
		} // End replaceworst_sim
		
		this.getnth_sim=function(n) {
			this.sort();
			if(n>=0) {
				return this.sim[n];
			} else {
				return this.sim[this.sim.length+n];
			}
		} // End getnth_sim
		
		this.centroid=function() {
			var out="";
			this.sort();
			var result=[];
			// build empty array
			for(i=0; i<this.dim; i++) {
				result.push(0);
			}
			out="";
			for(var i=0; i<this.sim.length-1; i++) {
				for(var k=0;k<this.sim[i].inputs.length;k++) {
					out+=+this.sim[i].inputs[k]+";";
					result[k]+=(this.sim[i].inputs[k])/this.dim;
				}
				out+="<br/>";
			}
			console.log(result);
			return result;
		} // End centroid
		
		// To string : makes resultset human readable
		this.toString=function() {
			var out="[<br/>";
			for(var i=0; i<this.sim.length; i++) {
				out+=this.sim[i].toString()+";<br/>";
			}
			out+="]";
			return out;
		} // End toString
	} // End resultset
	
	res = new resultset();
	
	// Calculate the next simulation
	// b : currently best simulation
	// m : multiplier
	function next_simulation(b,m) {
		var xr=new Array(b.length);
		// w : worst
		var w=res.sim[res.sim.length-1].inputs;
		for(var i=0; i<xr.length; i++) {
			// Loop over dimensions
			xr[i]=b[i]+m*(b[i]-w[i]);
		}
		return new simulation(xr)
	} // End next_simulation
	
	// Shrink
	// x : current simulation to shrink
	// b : best simulation
	function shrink(x,b) {
		var xs=new Array(x.length);
		for(var i=0; i<xs.length; i++) {
			// Loop over dimensions
			xs[i]=x[i]+0.5*(b[i]-x[i]);
		}
		return new simulation(xs);
	} // End of shrink
    function optimise_init() {
        self.nsim=0;
		res = null;
        res = new resultset();
		//no_improve_break=10;
		//no_improve_thr = 0.0001;
		out("Starting nelder mead");
		out("initiating");
		no_improve=0;
		self.iters=0;

		res.dim=start.length;
        route="optim_init_sim";
        run_state="running";
    }
    
    function optimise_init_sim() {
        var tmp_sim={};
        current_sim=null;
        res.sim.push(new simulation(start));
		for(var i=0; i<start.length; i++) {
			// Copy old array
			var newarray=start.slice();
			newarray[i]+=step[i];
			res.sim.push(new simulation(newarray));
		}
        
		/*out("Dimmensions is "+res.dim);
		out("Init values "+ res);
        */
        route="optim_post_init_sim";
    }

	function array_to_string(input) {
		var out="[";
		for(var i=0;i < input.length; i++) {
			if(i!=0) {
				out+=",";
			}
			out+=input[i].toFixed(decimals);
		}
		out+="]";
		return out;
	}
    
	function optimise_post_init_sim() {
        //res.sort();
        prev_best=res.sim[0].result;
        out("Dimmensions is "+res.dim);
		out("Init values "+ res);
        route = "optim_loop_start";
    }
    
    function optim_loop_start() {
        //		while(true) {
			out("<br/>");
			if(self.max_iter!=-1 && self.iters >=self.max_iter) {
				out("finished");
				route="optim_halted";
                return;
			}
			res.sort();
			//Look at the simulations by uncommenting this line
			//alert(JSON.stringify(res.sim));
			best=res.sim[0].result;
			worst = res.sim[res.sim.length-1].result;
			out("res "+res.toString());
			out("best so far "+res.sim[0]);
			// break condition
			if(error_mode=="abs") {
				var atol=Math.abs(best-worst);
				out("atol(|best-worst|)="+atol.toFixed(decimals)+" ftol="+self.req_error);
				tol=atol;
			} else {
				var rtol=2*Math.abs(best-worst)/(Math.abs(best)+Math.abs(worst));
				out("rtol "+rtol);
				tol=rtol;
			} // End break condition
            self.update();
            if(tol < self.req_error) {
                out("breaking becouse error >= req.error");
                route="optim_finished";
                return res.sim[0];
            }
			self.iters++;
            /*
			if(best < prev_best : no_improve_thr) {
				no_improve=0;
				prev_best=best;
			} else {
				no_improve+=1;
			}
			if(no_improve >= no_improve_break) {
				out("breaking no improve");
				return res.sim[0];
			}*/
        // If we didnt break go to optim_run
        route = "optim_calc_reflection";
    }
    
	// Optimiser
	// f : function to optimise
	// start : The starting values
	// step : How much to step each time
    
    function optim_calc_reflection() {
            // Centroid
            x0=res.centroid();
            out("centroid "+array_to_string(x0));
            // Reflection
            tmp_sim["xr"]=next_simulation(x0,1);
            route="optim_try_reflection";
    }
    
    function optim_try_reflection() {
        rscore=tmp_sim["xr"].result;
        console.log("xr");
        console.log(tmp_sim["xr"]);
        
        
        //out("reflection: rscore "+rscore.toFixed(decimals));
        out("reflection: rscore "+tmp_sim["xr"]);
        if((res.getnth_sim(0).result <= rscore) && (rscore < res.getnth_sim(-2).result)) {
            res.replaceworst_sim(tmp_sim["xr"]);
            out("decision1: Reflection");
            route="optim_loop_start";
            return;
        }
        route="optim_calc_expansion";
    }
    
    function optim_calc_expansion() {
        tmp_sim["xe"]=next_simulation(x0,2);
        route="optim_try_expansion";
    }
    
    function optim_try_expansion() {
        if(rscore < res.getnth_sim(0).result) {
            escore=tmp_sim["xe"].result;
            out("expansion escore "+tmp_sim["xe"]);
            if(escore < rscore) {
                res.replaceworst_sim(tmp_sim["xe"]);
                out("decision2: Expansion");
                route="optim_loop_start";
                return;
            } else {
                res.replaceworst_sim(tmp_sim["xr"]);
                out("decision2: Expansion not taken");
                route="optim_loop_start";
                return;
            }
        }
        route="optim_calc_contraction";
    }
    
    function optim_calc_contraction() {
        tmp_sim["xc"]=next_simulation(x0,-0.5);
        route="optim_try_contraction";
    }
    
    function optim_try_contraction() {
        cscore=tmp_sim["xc"].result;
        out("contraction cscore "+tmp_sim["xc"]);
        if(cscore < res.getnth_sim(-1).result) {
            res.replaceworst_sim(tmp_sim["xc"]);
            route="optim_loop_start";
            out("decision4: Contraction");
            return;
        }
        route="optim_shrink";
    }
    
    function optim_shrink() {
			bestsimulation=res.getnth_sim(0);
			out("sim length "+res.sim.length);
			for(var i=1; i<res.sim.length; i++) {
				out("acting on "+i);
				res.sim[i]=shrink(res.sim[i].inputs,bestsimulation.inputs);
			}
			out("shrink...");
        route="optim_loop_start";
    }
    
	function optimiser_run(inputs) {
        //var X1=inputs[0];
        //var X2=inputs[1];
        if(inputs.length!=self.num_vars()) {
            alert("Invalid number of inputs. inputs:"+inputs.length+" vartable:"+self.num_vars());
            return;
        }
        var tinputs={};
        i=0;
        for(var key in vartable) {
            var variable=vartable[key];
            tinputs[key]=inputs[i];
            i++;
        }
        self.event_before_run();
        imc_return_handlers["optimiser_run_model_return"]=self.return_handler;
        
        
        
        
		var toutputs=[];
		toutputs.push(objective_function);
		//~ toutputs.push('X0s');
		//~ toutputs.push('X0');
		//~ toutputs.push('Xs');
		//~ toutputs.push('Fixed_X0s');


 
       
        if(self.show_simulations) {
			// If we should show the gui
			// We only want to show_gui every show_interval:th time simulation or it will be to slow
			var show_interval = 1
			var show_gui = false;
			if(self.nsim % show_interval==0) {
				show_gui=true;
			}
			
			// If we use show simulations we want a delay between the simulations so we can see the results
			setTimeout(function() {
				imc_run_model(tinputs,toutputs,show_gui,"optimiser_run_model_return");
			}, 1000);
		} else {
			// If we should not show the gui
			show_gui=false;
			imc_run_model(tinputs,toutputs,show_gui,"optimiser_run_model_return");
		}
    }
    
	function fill_promises() {
        //alert("tmp_sim");
        console.log("filling pro");
        for(var key in tmp_sim) {
            if(tmp_sim[key].calculated==false) {
                if(tmp_sim[key].started==true) {
                    return;
                }
                console.log("calculating");
                current_sim=tmp_sim[key];
                tmp_sim[key].started=true;
                

                optimiser_run(tmp_sim[key].inputs);
                //alert("evaluating "+key);
                //tmp_sim[key].calc_result();
                return;
            }
        }
        //alert("res");
        for(var i=0; i<res.sim.length; i++) {
            if(res.sim[i].calculated==false) {
                if(res.sim[i].started==true) {
                    return;
                }
                console.log("calculating");
                res.sim[i].started=true;
                current_sim=res.sim[i];
                /*if(route=="optim_post_init_sim") {
                    k++;
                    alert("init "+k);
                }*/
                optimiser_run(res.sim[i].inputs);
                //res.sim[i].calc_result();
                return;
            }
        }
        console.log(res);
        simplex_adviser();
    }
    


    function simplex_adviser() {
        debug_alert("in simplex adviser");
        if(run_state!="running") {
            debug_alert("breaking becomse run state");
            return;
        }


    

        //alert("in simplex adviser "+route);
        switch(route) {
            case "optim_init":
                optimise_init();
                break;
            case "optim_init_sim":
                optimise_init_sim();
                break;
            case "optim_post_init_sim":
                optimise_post_init_sim();
                break;
            case "optim_loop_start":
                optim_loop_start();
                break;
            case "optim_calc_reflection":
                optim_calc_reflection();
                break;
            case "optim_try_reflection":
                optim_try_reflection();
                break; 
            case "optim_calc_expansion":
                optim_calc_expansion();
                break;
            case "optim_try_expansion":
                optim_try_expansion();
                break;
            case "optim_calc_contraction":
                optim_calc_contraction();
                break;
            case "optim_try_contraction":
                optim_try_contraction();
                break;
            case "optim_shrink":
                optim_shrink();
                break;
            case "optim_finished":
                self.set_run_state("halted");
                self.update();
                self.event_finished();
                break;
            case "optim_halted":
                self.set_run_state("halted");
                self.update();
        }
        fill_promises();
        debug_alert("finished a");
    }
    
	function clear() {
		$(self.console).html("");
	}
	
	function out(outstr) {
		$(self.console).append(outstr+"<br/>");
        var consolediv = document.getElementById("out_console");
        //consolediv.scrollTop = consolediv.scrollHeight;
    }
    
    
    
    
    
    
    
    
    
    
    



    self.return_handler=function(obj) {
		//alert(objective_function+" first "+obj.returnobj.variable[objective_function]);

		//obj.returnobj.variable["skiponcondition"]
		var skiponcondition_test_result = false;
		if(obj.returnobj.variable["SkipOnCondition"]===undefined) {
			skiponcondition_test_result = self.event_skiponcondition_test(false,undefined);
		} else {
			
			
		log+="estimate: "+parmest.actual_estimate+" skipped: "+parmest.skiponcondition_count+" "+JSON.stringify(obj.returnobj.variable)+"\n";
//~ alert(" asd"+obj.returnobj.variable["SkipOnCondition"]);
			skiponcondition_test_result = self.event_skiponcondition_test(true,obj.returnobj.variable["SkipOnCondition"]);
		}
				
		// If skipconditiontest fails we will not continue
		if(skiponcondition_test_result==false) {
			return;
		}
		// Skip on condition should be implemented here
        current_sim.result=self.min_max*obj.returnobj.variable[objective_function];
        current_sim.raw_result=obj.returnobj.variable[objective_function];
        current_sim.calculated=true;
        self.nsim++;
        self.update();


        fill_promises();
    };
//window.param_name=param_name;
};
var parmest_optimiser=new optimiserclass();
var optim_optimiser=new optimiserclass();

//optim_optimiser=optimiserclass();
//parmest_optimiser=optimiserclass();


function debug_alert(message) {
    if(debug_mode) {
        console.log(message);
        //alert(message);
    }
}
