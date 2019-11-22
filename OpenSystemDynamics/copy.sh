FILES="
js/Localization.js
js/Variables.js
js/Utilities.js
js/API/API.js
js/mxShim.js
js/Sanitize.js
js/Updater.js
js/SimulationEngine/OO.js
js/SimulationEngine/calc/unitsStructure.js
js/SimulationEngine/calc/units.js
js/SimulationEngine/SimpleCalc.js
js/SimulationEngine/calc/antlr3-all-min.js
js/SimulationEngine/calc/output/FormulaLexer.js
js/SimulationEngine/calc/output/FormulaParser.js
js/SimulationEngine/calc/rand.js
js/SimulationEngine/calc/random.js
js/SimulationEngine/calc/formula.js
js/SimulationEngine/calc/functions.js
js/SimulationEngine/Functions.js
js/SimulationEngine/Classes.js
js/SimulationEngine/Primitives.js
js/SimulationEngine/TaskScheduler.js
js/SimulationEngine/Simulator.js
js/SimulationEngine/Modeler.js
"
echo $FILES

for i in $FILES
do
mkdir -pv $(dirname $i)
cp -v old$i $i
done
