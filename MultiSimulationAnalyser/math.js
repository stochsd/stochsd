/*

Copyright 2017 Erik Gustafsson. All rights reserved.

This file may distributed and/or modified under the
terms of the Insight Maker Public License (https://InsightMaker.com/impl).

*/
function calc_confint_lambda(conf_level,opt_sides) {
    var result;
    if(opt_sides=="1") {
        result = invnormal(conf_level/ 100);
    } else {
        result = invnormal(1-(1 - conf_level/ 100) / 2);
    }
    return result;
}

// Calculate confidence interval
function calc_confints(lambda,varobj) {
    var num_data = varobj.data.length;
    var avrage = varobj.avrage
    var stddev = varobj.stddev;
    var interval={};
    interval.start=avrage - lambda * stddev / Math.sqrt(num_data);
    interval.end=avrage + lambda * stddev / Math.sqrt(num_data);
    return interval;
}

function confint_interval_from_level(varobj,level) {
    var lambda=calc_confint_lambda(level,"2");
    var interval = calc_confints(lambda,varobj);
    return interval;
}



// Initatizes a variable object and returns it
function initvar(varname) {
    // Set variable to empty
    variable=[];
    // Stores the variable name
    variable.name=varname;
    // Define last,avrage,min,max,variance and stddev. set to undefined
    variable.last=undefined;
    variable.avrage=undefined;
    variable.min=undefined;
    variable.max=undefined;
    variable.variance=undefined;
    variable.stddev=undefined
    
    // Define sum and sum2, set to 0
    variable.sum=0;
    variable.sum2=0;

    // Set the data array to empty
    variable.data=[];
    return variable;
}


// Adds a value to a variable object
function addnewvalue(variable,newvalue) {
    // Calculate sum
    variable.sum+=newvalue;
    
    // Calculate sum2
    variable.sum2+=newvalue*newvalue;
    
    // Calculate avrage
    variable.avrage=variable.sum/variable.data.length;

    
    // Avoid division by zero
    if((variable.data.length-1)==0) {
        // Break earlier only if number of data-1 is zero.
        // This only happens the first time
        variable.variance=0;
        variable.stddev=0;
        return variable;
    }
    
    // Calculate variance
    variable.variance = (variable.sum2 - variable.sum*variable.sum/variable.data.length)/(variable.data.length-1)
    //alert(variable.variance);
    
    // We have in rare cases a precision bug due to javascript that can make the variable have value e.g -2.220446049250313e-16
    // This causes problem when we take the root of this number so therefor we have to force variance to be >=0
    if(variable.variance<0) {
		variable.variance=0;
	}
    
    // Calculate std.dev
    variable.stddev = Math.sqrt(variable.variance)



    
    
    
    return variable;
}

function correlation_coefficient(x,y) {
    if(x.length!=y.length) {
        // The variables must have the same number of data
        return false;
    }
    var sum_x=0, sum_x2=0,sum_y=0,sum_y2=0,sum_xy=0;
    
    // Length is the number of data eg. 0..n gives length=n+1
    length = x.length;
    
    for(i=0;i<length;i++) {
        sum_x+=x[i];
        sum_x2+=x[i]*x[i];
        sum_y+=y[i];
        sum_y2+=y[i]*y[i];
        sum_xy+=x[i]*y[i];
    }
    E_x = sum_x/length;
    E_x2 = sum_x2/length;
    E_y = sum_y/length;
    E_y2 = sum_y2/length;
    E_xy = sum_xy/length;
    
    // Calculate variances
    var_x=E_x2-E_x*E_x;
    var_y=E_y2-E_y*E_y;
    
    // Calculate std.deviation
    stddev_x = Math.sqrt(var_x);
    stddev_y = Math.sqrt(var_y);
    
    Cov = E_xy - E_x*E_y;
    rho = Cov/(stddev_x*stddev_y);
    
    return rho;
}

function sgn(number) {
    if(number==0) {
        return 0;
    } else if (number < 0) {
        return -1;
    } else {
        return 1;
    }
}

function invnormal(P0) {
    A1=2.30753;
    A2=0.27061;
    A3=0.99229;
    A4=0.04481;
    Q0 = 0.5 - Math.abs(P0-0.5);
    W = Math.sqrt(-2 * Math.log(Q0));
    W1 = A1+A2*W;
    W2 = 1 + W*(A3 + W*A4);
    Z = W - W1/W2;
    Z = Z * sgn(P0 - 0.5);
    return Z;
}

function IsNumeric(n) {
    if(n!="" && !isNaN(n)) {
        return true;
    } else {
        return false;
    }
}
