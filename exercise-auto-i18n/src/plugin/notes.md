[Babel 插件通关秘籍 - zxg_神说要有光 - 掘金课程 (juejin.cn)](https://juejin.cn/book/6946117847848321055/section/6951617082454704162)

```
[
  { key: 'intl1', value: 'title' },
  { key: 'intl2', value: 'desc' },
  { key: "int13", value: 'aaa {placeholder} bbb {placeholder] ccc' },
  { key: "intl4", value: 'app' },
  { key: 'intls', value: '测试' }
]
```

```js
import _intl from 'intl';
import intl from 'intl2';
/**
 * App
 */

function App() {
  const title = _intl.t('intl1');

  const desc = _intl.t('intl2');

  const desc2 = `desc`;

  const desc3 = _intl.t('intl3', title + desc, desc2);

  return <div className={_intl.t('intl4')} title={_intl.t('intl5')}>
        <img src={Logo} />
        <h1>${title}</h1>
        <p>${desc}</p>  
        <div>
        {'中文'}
        </div>
      </div>;
}
```

## Q&A?
### intl.t 为什么是.t呢？ 模拟？
.t 是国际化普遍的命名，不是随意的命名，类似于约定俗成的一个东西
这里的 intl.t 就是从资源 bundle 中取值：
比如：
const locale = 'zh-CN';
intl.t = function(key) {
  return bundle[locale][key]
}
