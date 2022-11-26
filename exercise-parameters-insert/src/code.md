## insert

### version1.js

```js
traverse(ast, {
  CallExpression (path, state) {
    if (types.isMemberExpression(path.node.callee)
      && path.node.callee.object.name === 'console'
      && ['log', 'info', 'error', 'debug'].includes(path.node.callee.property.name)) {
      // console.log(path.node.callee);
      const { line, column } = path.node.loc.start;
      path.node.arguments.unshift(types.stringLiteral(`filename:(${line},${column})`))
    }
  }
})
```
console.log(path.node.callee);结果如下

```sh
Node {
  type: 'MemberExpression',
  start: 5,
  end: 16,
  loc: SourceLocation {
    start: Position { line: 2, column: 4, index: 5 },
    end: Position { line: 2, column: 15, index: 16 },
    filename: undefined,
    identifierName: undefined
  },
  object: Node {
    type: 'Identifier',
    start: 5,
    end: 12,
    loc: SourceLocation {
      start: [Position],
      end: [Position],
      filename: undefined,
      identifierName: 'console'
    },
    name: 'console'
  },
  computed: false,
  property: Node {
    type: 'Identifier',
    start: 13,
    end: 16,
    loc: SourceLocation {
      start: [Position],
      end: [Position],
      filename: undefined,
      identifierName: 'log'
    },
    name: 'log'
  }
}
```



#### 正确输出

```js
console.log("filename:(2,4)", 1);
function func() {
  console.info("filename:(5,8)", 2);
}
export default class Clazz {
  say() {
    console.debug("filename:(10,12)", 3);
  }
  render() {
    return <div>{console.error("filename:(13,25)", 4)}</div>;
  }
}
```



```js
const targetCalleeName = ['log', 'info', 'error', 'debug'].map(item => `console.${item}`);

traverse(ast, {
  CallExpression (path, state) {
    const calleeName = generate(path.node.callee).code;
    console.log('calleeName: ', calleeName);

    if (targetCalleeName.includes(calleeName)) {
      const { line, column } = path.node.loc.start;
      path.node.arguments.unshift(types.stringLiteral(`filename:(${line},${column})`))
    }
  }
})
```


```js
calleeName:  console.log

calleeName:  console.info

calleeName:  console.debug

calleeName:  console.error
```
