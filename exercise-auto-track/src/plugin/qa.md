### 为什么要把对ImportDeclaration的遍历放在Program下，而对ClassMethod、FunctionExpression等又放在外层呢
在根结点自己做一次遍历，先处理下 import 节点，和外层遍历不是同一次遍历，顺序不同

### import tracker from 'tracker'，代码中缺少对ImportDefaultSpecifier情况的检测
不少，原因是下方
### 这节例子中，建议删除path.stop()这一句。经过测试，如果sourceCode原本已经引入'tracker'（如图）, path.stop()会导致停止遍历后续函数数节点。

path.stop()没有阻止对ImportDeclaration的遍历，反而阻止了对其他节点的遍历。。。停了个寂寞

curPath.stop()吧