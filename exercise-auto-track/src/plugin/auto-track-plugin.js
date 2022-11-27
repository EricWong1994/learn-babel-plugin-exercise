const { declare } = require('@babel/helper-plugin-utils');
const importModule = require('@babel/helper-module-imports');

const autoTrackPlugin = declare((api, options, dirname) => {
  api.assertVersion(7);

  return {
    visitor: {
      Program: {
        enter (path, state) {
          path.traverse({
            ImportDeclaration (curPath) {
              // requirePath引入路径的名称: tracker
              const requirePath = curPath.get('source').node.value;
              // 如果js文件已经引入了tracker
              if (requirePath === options.trackerPath) {
                // specifierPath（指定路径）：_tracker2
                const specifierPath = curPath.get('specifiers.0');
                // isImportSpecifier(): 判断是否是import {defaults,partition} from 'lodash' 这种方式引入的
                if (specifierPath.isImportSpecifier()) {
                  state.trackerImportId = specifierPath.toString();
                  // 是否为import * as _ from 'lodash'的命名空间格式导入
                } else if (specifierPath.isImportNamespaceSpecifier()) {
                  state.trackerImportId = specifierPath.get('local').toString();
                }
                // path.stop();
                curPath.stop()
              }
            }
          });
          if (!state.trackerImportId) {
            //state.trackerImportId: _tracker2
            state.trackerImportId = importModule.addDefault(path, 'tracker', {
              nameHint: path.scope.generateUid('tracker')
            }).name;
            state.trackerAST = api.template.statement(`${state.trackerImportId}()`)();
          }
        }
      },
      'ClassMethod|ArrowFunctionExpression|FunctionExpression|FunctionDeclaration' (path, state) {
        const bodyPath = path.get('body');
        if (bodyPath.isBlockStatement()) { // 有函数体就在开始插入埋点代码
          bodyPath.node.body.unshift(state.trackerAST);
        } else { // 没有函数体要包裹一下，处理下返回值
          const ast = api.template.statement(`{${state.trackerImportId}();return PREV_BODY;}`)({ PREV_BODY: bodyPath.node });
          bodyPath.replaceWith(ast);
        }
      }
    }
  }
});
module.exports = autoTrackPlugin;
