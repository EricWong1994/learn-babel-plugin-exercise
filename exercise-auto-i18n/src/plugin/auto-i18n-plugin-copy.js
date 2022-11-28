const { declare } = require('@babel/helper-plugin-utils');
const fse = require('fs-extra');
const path = require('path');
const generate = require('@babel/generator').default;

let intlIndex = 0;
function nextIntlKey () {
  ++intlIndex;
  return `intl${intlIndex}`;
}

const autoTrackPlugin = declare((api, options, dirname) => {
  api.assertVersion(7);
  function getReplaceExpression (path, value, intlUid) {
    const expressionParams = path.isTemplateLiteral() ? path.node.expressions.map(item => generate(item).code) : null
    let replaceExpression = api.template.ast(`${intlUid}.t('${value}'${expressionParams ? ',' + expressionParams.join(',') : ''})`).expression;
    // 要判断是否在 JSXAttribute 下，如果是，则必须要包裹在 JSXExpressionContainer 节点中（也就是{ }）
    if (path.findParent(p => p.isJSXAttribute()) && !path.findParent(p => p.isJSXExpressionContainer())) {
      replaceExpression = api.types.JSXExpressionContainer(replaceExpression);
    }
    return replaceExpression;
  }

  // save 方法则是收集替换的 key 和 value，保存到 file 中
  // [
  //   { key: 'intl1', value: 'title' },
  //   { key: 'intl2', value: 'desc' },
  //   { key: "int13", value: 'aaa {placeholder} bbb {placeholder} ccc' },
  //   { key: "intl4", value: 'app' },
  //   { key: 'intls', value: '测试' }
  // ]
  function save (file, key, value) {
    const allText = file.get('allText');
    allText.push({
      key, value
    });
    file.set('allText', allText);
  }

  return {
    pre (file) {
      file.set('allText', []);
    },
    visitor: {
      Program: {
        enter (path, state) {
          let imported;
          path.traverse({
            ImportDeclaration (p) {
              const source = p.node.source.value;
              if (source === 'intl') {
                imported = true
              }
            }

          });
          if (!imported) {
            // uid: '_intl'
            const uid = path.scope.generateUid('intl')
            const importedAst = api.template.ast(`import ${uid} from 'intl'`)
            path.node.body.unshift(importedAst)
            state.intlUid = uid;
          }
          path.traverse({
            'StringLiteral|TemplateLiteral' (path) {
              if (path.node.leadingComments) {
                path.node.leadingComments = path.node.leadingComments.filter((comment, index) => {
                  if (comment.value.includes('i18n-disable')) {
                    path.node.skipTransform = true;
                    return false;
                  }
                  return true;
                })
              }
              // 该行作用 import 语句中的路径值也属于StringLiteral，而路径值不应国际化
              if (path.findParent(p => p.isImportDeclaration())) {
                path.node.skipTransform = true;
              }
            }
          })
        }
      },
      StringLiteral (path, state) {
        if (path.node.skipTransform) {
          return;
        }
        let key = nextIntlKey();
        // path.node.value 第一次：'title' 第2次'app' 第3次'测试'
        save(state.file, key, path.node.value);
        // getReplaceExpression 是生成替换节点的一个方法
        const replaceExpression = getReplaceExpression(path, key, state.intlUid);

        path.replaceWith(replaceExpression);
        path.skip();
      },
      // 模版字符串需要吧 ${} 表达式的部分替换为 {placeholder} 的占位字符串
      TemplateLiteral (path, state) {
        if (path.node.skipTransform) {
          return;
        }
        const value = path.get('quasis').map(item => item.node.value.raw).join('{placeholder}');
        // 第一次：'desc'
        // 第2次："aaa {placeholder} bbb {placeholder} ccc"
        if (value) {
          let key = nextIntlKey();
          save(state.file, key, value);

          const replaceExpression = getReplaceExpression(path, key, state.intlUid);
          path.replaceWith(replaceExpression);
          path.skip();
        }
      },
    },
    // post 阶段取出来allText用于生成 resource 文件
    post (file) {
      const allText = file.get('allText');
      const intlData = allText.reduce((obj, item) => {
        obj[item.key] = item.value;
        return obj;
      }, {});

      const content = `const resource = ${JSON.stringify(intlData, null, 4)};\nexport default resource;`;
      fse.ensureDirSync(options.outputDir);
      fse.writeFileSync(path.join(options.outputDir, 'zh_CN.js'), content);
      fse.writeFileSync(path.join(options.outputDir, 'en_US.js'), content);
    }
  }
});
module.exports = autoTrackPlugin;