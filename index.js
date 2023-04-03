/*
Copyright 2023 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

/** @note this is a linting tool */
/** @type import('postcss').PluginCreator */
module.exports = (opts = {}) => {
  const { quiet = false, lint = false } = opts;
  return {
    postcssPlugin: 'postcss-dropdupedvars',
    prepare() {
      const seen = new Map();
      return {
        Declaration(decl) {
          if (!decl.prop.startsWith('--')) return;

          const rule = decl.parent;
          let mq;
          if (rule && rule.parent && rule.parent.type === 'atrule') {
            mq = rule.parent.name + rule.parent.params;
          }

          /* A combination of media query and selector */
          const identifier = `${mq ?? ''}${rule.selector ? ` ${rule.selector}` : ''}`;

          if (!seen.has(identifier)) {
            seen.set(identifier, new Map([
              [ decl.prop, decl ]
            ]));
            return;
          }

          /* Fetch the nested property map if the identifier exists already */
          const propMap = seen.get(identifier);

          /* Check if that map has this declaration already */
          if(!propMap.has(decl.prop)) {
            propMap.set(decl.prop, decl);
            return;
          }

          const prevDecl = propMap.get(decl.prop);
          /* Update the map with the new declaration */
          propMap.set(decl.prop, decl);

          if (!lint) {
            // We always remove the previously found declaration b/c
            // it's the one used in the CSSOM.
            prevDecl.remove();
            return;
          }

          if (!quiet) {
            throw decl.error(`🔴 Duplicate variable ${decl.prop} for ${identifier}`, {
              plugin: 'postcss-dropdupedvars',
              word: decl.prop,
            });
          }
        },
      };
    },
  };
};

module.exports.postcss = true;
