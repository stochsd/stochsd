function global_log_update() {
	let log = "";
	log += "<br/>";
	log += global_log + "<br/>";
	$(".log").html(log);
}

function do_global_log(line) {
	if (Settings.showDebug) {
		global_log = line + "; " + (new Date()).getMilliseconds() + "<br/>" + global_log;
		global_log_update();
	}
}

class DebugDialog extends jqDialog {
	constructor() {
		super();
		this.nameField = null;
		this.setTitle("Debug");
		this.setHtml(`
			<div id="log_panel" style="z-index: 10; position: absolute; left: 0px; top: 0px; height: 90%; overflow-x: visible">
				This windows is only for developers of StochSD. If you are not developing StochSD you probably dont need this.<br/>
				<button class="btn_clear_log">clear</button>
				<div class="log" style="width: 100%; height: 90%; overflow-y: scroll;">
				</div>
			</div>
		`);

		$(this.dialogContent).find(".btn_clear_log").click((event) => {
			global_log = "";
			global_log_update();
		});
	}
	beforeCreateDialog() {
		this.dialogParameters.modal = false;
		this.dialogParameters.width = 600;
		this.dialogParameters.height = 400;
	}
}

class CloseDialog extends jqDialog {
	beforeCreateDialog() {
		this.dialogParameters.buttons = {
			"Close": () => {
				$(this.dialog).dialog('close');
			}
		};
	}
}

class AboutDialog extends CloseDialog {
	constructor() {
		super();
		this.setTitle("About StochSD");
		this.setHtml(`
			<div style="min-width:300px; max-width: 800px;">
			<img src="graphics/stochsd_high.png" style="width: 128px; height: 128px"/><br/>
			<b>StochSD version ${stochsd.version} (YYYY.MM.DD)</b><br/>
			<br/>
			<b>StochSD</b> (<u>Stoch</u>astic <u>S</u>ystem <u>D</u>ynamics) is an extension of System Dynamics into the field of 	<b>stochastic modelling</b>. In particular, you can make statistical analyses from multiple simulation runs.<br/>
			<br/>
			StochSD is an open source program based on the <a target="_blank" href="http://insightmaker.com">Insight Maker engine</a> (insightmaker.com) developed by Scott Fortmann-Roe. However, the graphic package of Insight Maker is replaced to make StochSD open for use as well as modifications and extensions. The file handling system is also rewritten. Finally, tools for optimisation, sensitivity analysis and statistical analysis are supplemented.<br/>
			<br/>
			StochSD was developed by Leif Gustafsson, Erik Gustafsson and Magnus Gustafsson, Uppsala University, Uppsala, Sweden.<br/>
			Mail: leif.gunnar.gustafsson@gmail.com 
			</div>
		`);
	}
}

class FullPotentialCSSDialog extends CloseDialog {
	constructor() {
		super();
		this.setTitle("What is Full Potential CSS?");
		this.setHtml(`
		<div style="min-width: 300px; max-width: 1300px; overflow-y: auto;">
		<p>A real SYSTEM can be <i>described</i> as a well-defined CONCEPTUAL MODEL in text, figure and values. This conceptual model can then be <i>realised</i> as an executable <b>Micro Model</b> where each object is represented as an entity, or as an executable <b>Macro Model</b> where a 'Population' of entities are aggregated into a few stages. For example:</p>
		<table class="modern-table zebra center-horizontally">
			<tr><th></th><th>Micro approach</th><th>Macro approach</th></tr>
			<tr><td>Flowing water</td><td>H<sub>2</sub>O molecules</td><td>A river</td></tr>
			<tr><td>A disease process</td><td>Individual level (Medicine)</td><td>Population level (Epidemiology)</td></tr>
			<tr><td>Biology</td><td>Individual of a species</td><td>Ecological system</td></tr>
			<tr><td>Traffic</td><td>Individual vehicles</td><td>Traffic flows</td></tr>
		</table>
		<p>Regardless of whether you choose a micro approach using <b>Discrete Event Simulation</b> (DES) or a macro approch using <b>Continuous System Simulation</b> (CSS), the results should be <b>consistent</b> (contradiction free), i.e. averages, variations, correlation, etc. should be the same. See the Figure.</p>
		<img src="graphics/what_is_fp_css.png" style="display: block; max-width: 700px; margin: 0 auto;"/>
		<p>Consistency is usually not obtained for <b>Classical CSS</b>. However, if the <b>Full Potential CSS</b> approach is followed, you can obtain results consistent with those from a micro model.</p>
		<h3>Full Potential CSS requirements</h3>
		<p>To correctly <i>realise</i> a <b>Conceptual model</b> into an <b>CSS model</b> the following rules must be applied:</p>
		<ol>
			<li>Discrete objects must be modelled as discrete (unless they can be regarded as continuous according to the Law of Large Numbers). Continuous matter should be modelled as continuous.</li>
			<li>Attribute values are realised by multiple parallel sub-structures (Attribute expansion). </li>
			<li>Distribution of the sojourn (stay) times in a stage are obtained by modelling the stage by a structure of compartments in series and/or parallel. (Stage-to-compartment expansion).</li>
			<li>
				Uncertainties of different types must realise the description in the well-defined conceptual model. This applies to:<br/>
				&bull; Model structure &bull; Initial values &bull; Transitions &bull; Environmental influences &bull; Signals 
			</li>
		</ol>
		<p>Classical CSS cannot fulfil these conditions – but Full Potential CSS can! If one of several of these issues is part of the conceptul model, Full Potential CSS provides the way to correctly implement them in a CSS model.</p>
		<p>To do so Full Potential CSS requires devices to model discrete/continuous/combined processes and to handle the different types of uncertainties as well as multiple simulations followed by a statistical analysis and presentation of the results in statistical terms.</p>
		<p style="display: flex; flex-direction: row;">
			<img src="graphics/stochsd_high.png" style="width: 32px; height: 32px; position: inline; margin-right: 8px;"> 
			<span><i style="display: flex; flex-direction: column; justify-content: center; height: 100%;">StochSD is a package that can accomplish this.</i></span>
		</p>
		<p>
			At <a target="_blank" href="https://stochsd.sourceforge.io/homepage/" >StochSD’s homepage</a> you find the theoretical papers describing this in detail. You also find Example Models that demonstrates the necessity of following the Full Potential rules. Further there are five Laboratory Exercises that teaches model building and simulation in CSS. &#x25A0;
		</p>
		</div>
		`);
		$(this.dialogContent).find("a").css("color", "blue");
		$(this.dialogContent).find("a").click((event) => {
			let url = event.currentTarget.href;
			if (environment.openLink(url)) {
				event.preventDefault();
			}
		});
	}
}

class LicenseDialog extends CloseDialog {
	constructor() {
		super();
		this.setTitle("StochSD License");

		let currentYear = new Date().getFullYear();
		this.setHtml(`
		<p style="display: inline-block">
		Copyright 2010-${currentYear} StochSD-Team and Scott Fortmann-Roe. All rights reserved.<br/>

		The Insight Maker Engine was contributed to StochSD project from
		Insight Maker project by Scott Fortmann-Roe, <a target="_blank" href="https://insightmaker.com">https://Insightmaker.com<a><br/>
		</p><br/>
		<iframe style="width: 700px; height: 500px;" src="license.html"/>
		</div>
		`);
	}
}

class ThirdPartyLicensesDialog extends CloseDialog {
	constructor() {
		super();
		this.setTitle("Third-party Licenses");

		this.setHtml(`
		<iframe style="width: 700px; height: 500px;" src="third-party-licenses.html"/>
		</div>
		`);
	}
}

