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

// This file is not used in the final stocsd. Instead a more complicated optimiser.js is used
// This was the first proof of concept optimiser which is good for demonstrating the principle
// But it it does not support splitting up the simulation into many small chunks which is why the
// More complicated optimiser.js is used

decimals=10;


var optimiser=new function() {
	this.max_iter=0;
	this.req_error=0.0001;
	this.error_mode="abs"; // Can be abs or rel
	this.iters=0;
	this.update=function() {
		// Callback on every iteration
	};
	this.nsim=0;
}

	var f1=function(x) {
		return Math.sin(x[0]);
	} // End f1
	
	var f2=function(x) {
		return Math.pow((1-x[0]),2)+100*Math.pow(x[1]-Math.pow(x[0],2),2)
	} // End f2
	
	var f3=function(x) {
		// 	return math.sin(x[0])*math.cos(x[1])*(1./(abs(x[2])+1))
		return Math.sin(x[0])*Math.cos(x[1])*(1./(Math.abs(x[2])+1))
	} // End f3
	var f=f2;
	
	// Simulation : holds one single simulation
	// f : the function we use for simulation
	// input : the values x0.. xn for this simulation
	var simulation = function(f,inputs) {
		optimiser.nsim++;
		out("nsim "+optimiser.nsim);
		
		this.inputs=inputs;
		this.result=f(inputs);
		
		// To string : makes simulation human readable
		this.toString=function() {
			var out="[";
			for(i=0; i<this.inputs.length; i++) {
				out+=this.inputs[i].toFixed(decimals);
				out+=";"
			}
			out+="]=";
			out+=this.result.toFixed(decimals);
			return out;
		}; // End toString
	} // End simulation
	
	// Holds a set of simulations
	var resultset = function() {		
		this.sim = [];
		this.dim=0;
		
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
	
	// =========================================================	
	// Program starts here
	//$(document).ready(function() {
		//optimise(f,[0],[0.1]);
	//	optimise(f,[-1,1],[0.1,0.1]);
		//optimise(f,[0,0,0],[0.1,0.1,0.1]);
	//}); // End ready
	
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
		return new simulation(f,xr)
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
		return new simulation(f,xs);
	} // End of shrink
	
	// Optimiser
	// f : function to optimise
	// start : The starting values
	// step : How much to step each time
	function optimise(f,start,step) {
		optimiser.nsim=0;
		res = new resultset();
		clear();
		//no_improve_break=10;
		//no_improve_thr = 0.0001;
		out("Starting nelder mead");
		out("initiating");
		res.dim=start.length;
		res.sim.push(new simulation(f,start));
		for(i=0; i<start.length; i++) {
			// Copy old array
			var newarray=start.slice();
			newarray[i]+=step[i];
			res.sim.push(new simulation(f,newarray));
		}
		out("Dimmensions is "+res.dim);
		out("Init values "+ res);
		error_mode=optimiser.error_mode;
		ftol=optimiser.req_error;
		no_improve=0;
		res.sort();
		prev_best=res.sim[0].result;
		max_iter=optimiser.max_iter;
		iters=0;
		while(true) {
			out("<br/>");
			if(max_iter && iters >=max_iter) {
				out("finished");
				break;
			}
			iters++;
			optimiser.iters=iters;
			optimiser.update();
			out("iter "+iters);
			res.sort();
			best=res.sim[0].result;
			worst = res.sim[res.sim.length-1].result;
			out("res "+res.toString());
			out("best so far "+res.sim[0]);
			out("no improve "+no_improve);
			
			// break condition
			if(error_mode=="abs") {
				atol=Math.abs(best-worst);
				out("atol "+atol+" ftol "+ftol);
				if(atol < ftol) {
					out("breaking becouse of atol");
					return res.sim[0];
				}	
			} else {
				rtol=2*Math.abs(best-worst)/(Math.abs(best)+Math.abs(worst));
				out("rtol "+rtol);
				if(rtol < ftol) {
					out("breaking becouse of rtol");
					return res.sim[0];
				}
			} // End break condition
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
			out("Getting centroid");
			
			// Centroid
			x0=res.centroid();
			
			// Reflection
			xr=next_simulation(x0,1);
			console.log("xr");
			console.log(xr);
			rscore=xr.result;
			out("reflection: rscore "+rscore.toFixed(decimals));
			if((res.getnth_sim(0).result <= rscore) && (rscore < res.getnth_sim(-2).result)) {
				res.replaceworst_sim(xr);
				out("continue1: reflection");
				continue;
			}
			// End Reflection
			
			// Expansion
			if(rscore < res.getnth_sim(0).result) {
				

				xe=next_simulation(x0,2);
				escore=xe.result;
				out("xe");
				out(xe);
				out("expansion escore "+escore.toFixed(decimals));
				if(escore < rscore) {
					res.replaceworst_sim(xe);
					out("continue2: expansion");
					continue;
				} else {
					res.replaceworst_sim(xr);
					out("continue2: expansion not taken");
					continue;
				}
			}
			// End Expansion
			
			// Contraction
			xc=next_simulation(x0,-0.5);
			cscore=xc.result;
			out("contraction cscore "+cscore.toFixed(decimals));
			if(cscore < res.getnth_sim(-1).result) {
				res.replaceworst_sim(xc);
				out("continue4 contraction");
				continue;
			}
			// End Contraction
			
			// Shrink
			bestsimulation=res.getnth_sim(0);
			out("sim length "+res.sim.length);
			for(var i=1; i<res.sim.length; i++) {
				out("acting on "+i);
				res.sim[i]=shrink(res.sim[i].inputs,bestsimulation.inputs);
			}
			out("shrink...");
			// End Shrink
		}
	} // End optimise
	
	function clear() {
		$("#out_console").html("");
	}
	
	function out(outstr) {
		$("#out_console").append(outstr+"<br/>");
	}
