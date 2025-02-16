
class PrimitiveSvgPreview {
   /**
    * Create a SVG preview of a primitive
    * @param {"stock" | "variable" | "constant" | "flow" | "converter"} type 
    * @param {{color?: string, ghost?: boolean, dice?: true}} options 
    * @returns {string}
    */
   static create(type, options = { color: "black" }) {
      let icons = ""
      icons += options.ghost ? this.icons.ghost : ""
      icons += options.dice ? this.icons.dice : ""
      return this.primitiveSvgPreview[type.toLowerCase()]
         .replace("COLOR_PLACEHOLDER", options.color)
         .replace("ICONS_PLACEHOLDER", icons)
   }
   static primitiveSvgPreview = {
      stock: `<svg
      style="color: COLOR_PLACEHOLDER;"
      width="100%"
      viewBox="0 0 20 20"
      version="1.1">
      <g>
         <rect
            class="svg-preview-stock-outer"
            x="2"
            y="4"
            width="16"
            height="12"
            id="rect6415"
            style="fill:#ffffff; stroke:currentColor; stroke-width:1; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1" />
         <rect
            class="svg-preview-stock-inner"
            x="3"
            y="5"
            width="14"
            height="10"
            id="rect6415-3"
            style="fill:none; fill-opacity:1; stroke:none;stroke-width:0; stroke-miterlimit:4; stroke-dasharray:none" />
            <g class="svg-preview-icons">
               ICONS_PLACEHOLDER
            </g>
      </g>
   </svg>`,
      variable: `<svg
      style="color: COLOR_PLACEHOLDER;"
      width="100%"
      viewBox="0 0 20 20"
      version="1.1">
         <g>
            <circle cx="10" cy="10" r="7" stroke-width="1" fill="none" stroke="currentColor" />
            <g class="svg-preview-icons">
               ICONS_PLACEHOLDER
            </g>
         </g>
      </svg>`,
      constant: `<svg 
         style="color: COLOR_PLACEHOLDER;"
         width="100%"
         viewBox="0 0 20 20"
         version="1.1">
            <g transform="translate(10, 10)">
               <path fill="none" stroke="currentColor" d="M0,8 8,0 0,-8 -8,0Z" />
            </g>
            <g class="svg-preview-icons">
                 ICONS_PLACEHOLDER
            </g>
         </svg>`,
      flow: `<svg
      style="color: COLOR_PLACEHOLDER;"
      width="100%"
      viewBox="0 0 20 20"
      version="1.1">
         <g>
            <path class="svg-preview-flow-valve" stroke-width="1" fill="none" stroke="currentColor" 
               d="M 10,5 6,1 14,1 Z" />
            <circle cx="10" cy="12" r="7" stroke-width="1" fill="none" stroke="currentColor" />
                     <path class="svg-preview-flow-arrow" stroke-width="1" fill="white" stroke="currentColor" 
                     d="M 1,6 V 4 H 16 V 2 L 19,5 L 16,8 V 6 Z" />
            <g transform="translate(0, 2)" class="svg-preview-icons">
               ICONS_PLACEHOLDER
            </g>
         </g>
      </svg>`,
      converter: `<svg 
         style="color: COLOR_PLACEHOLDER;"
         width="100%"
         viewBox="0 0 20 20"
         version="1.1">
            <g transform="translate(10, 10)">
               <path fill="none" stroke="currentColor" d="M-8 0  L-4 -6  L4 -6  L8 0  L4 6  L-4 6  Z" />
            </g>
             <g class="svg-preview-icons">
                 ICONS_PLACEHOLDER
            </g>
         </svg>`,
   }
   static icons = {
      ghost: `<g transform="translate(10, 10) scale(0.4)">
         <path fill="none" stroke="currentColor" stroke-width="2" d="m 9.9828659,-2.772745 c 0,1.3775907 0.2255841,11.8988413 -0.2819803,13.083087 C 9.1933216,11.50264 7.203349,7.3618143 6.3090708,8.2640961 5.4067353,9.1663779 5.0844728,10.004211 3.8921001,10.511744 2.699728,11.011221 1.3945641,8.1996473 0.01689062,8.1996473 -1.3607825,8.1996473 -2.6659466,11.011221 -3.858319,10.511744 -5.050691,10.004211 -5.2601616,9.6014057 -6.1624971,8.6991239 -7.0648332,7.7968422 -9.2320496,11.542923 -9.7396135,10.350622 -10.239121,9.1583207 -9.9490844,-1.3951543 -9.9490844,-2.772745 c 0,-5.4942523 4.4633386,-9.957325 9.96597502,-9.957325 5.50263598,0 9.96597528,4.4630727 9.96597528,9.957325 z">
      </g>`,
      dice: `<g transform="translate(10, 10) scale(0.4)">
         <path fill="none" stroke="currentColor" stroke-width="1" d="m -3.5463331,-9.2427435 -4.2426784,4.7879684 V 6.5315532 l 12.8085634,0.6925413 2.4411505,-6.1592462 0.052919,-9.52762 z m 0.2231778,0.4831683 10.0499019,0.6626308 -2.1719568,3.7180958 -11.338351,-0.441754 z m 5.8900524,1.0284584 a 1.4725126,0.6828872 0 0 0 -1.4725131,0.683338 1.4725126,0.6828872 0 0 0 1.4725131,0.6810374 1.4725126,0.6828872 0 0 0 1.4725131,-0.6810374 1.4725126,0.6828872 0 0 0 -1.4725131,-0.683338 z m -5.5265258,0.8535974 a 1.4725126,0.72416619 0 0 0 -1.472513,0.7247526 1.4725126,0.72416619 0 0 0 1.472513,0.7247525 1.4725126,0.72416619 0 0 0 1.4725131,-0.7247525 1.4725126,0.72416619 0 0 0 -1.4725131,-0.7247526 z m -4.2288736,2.645922 11.5868376,0.43025 -0.073626,10.491656 -11.4763991,-0.6879398 z m 2.9450262,1.4357003 a 1.472513,1.472513 0 0 0 -1.4725131,1.4725131 1.472513,1.472513 0 0 0 1.4725131,1.47251311 1.472513,1.472513 0 0 0 1.4725132,-1.47251311 1.472513,1.472513 0 0 0 -1.4725132,-1.4725131 z m 5.22742159,0.1840641 a 1.4725131,1.4725131 0 0 0 -1.35747298,0.8973128 1.4725131,1.4725131 0 0 0 -0.0506177,0.1403489 1.4725131,1.4725131 0 0 0 -0.0644225,0.4348514 A 1.4725131,1.4725131 0 0 0 0.98394549,0.33319327 1.4725131,1.4725131 0 0 0 2.4564586,-1.1393199 1.4725131,1.4725131 0 0 0 0.98394549,-2.611833 Z M -4.0225991,1.8425192 a 1.4725126,1.4725126 0 0 0 -1.4725131,1.4725132 1.4725126,1.4725126 0 0 0 1.4725131,1.4725131 1.4725126,1.4725126 0 0 0 1.472513,-1.4725131 1.4725126,1.4725126 0 0 0 -1.472513,-1.4725132 z m 4.93291896,0.2576899 a 1.472513,1.472513 0 0 0 -1.47251311,1.472513 1.472513,1.472513 0 0 0 0.522282,1.1250922 1.472513,1.472513 0 0 0 0.11734089,0.089731 A 1.472513,1.472513 0 0 0 0.91031986,5.0452349 1.472513,1.472513 0 0 0 2.3828329,3.5727221 1.472513,1.472513 0 0 0 0.91031986,2.1002091 Z">
      </g>`
   }
}



