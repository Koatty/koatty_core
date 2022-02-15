/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2021-12-18 20:53:46
 * @LastEditTime: 2022-02-15 11:36:33
 */
module.exports = {
  extends: ['gitmoji'],
  rules: {
    // 'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore',
    //   '🎉 init', '✨ feat', '🐞 fix', '📃 docs', '🌈 style', '🦄 refactor', '🎈 perf', '🧪 test', '🔧 build', '🐎 ci', '🐳 chore', '↩ revert']],
    // 'type-empty': [2, 'never'],
    'scope-enum': [0], // 不校验scope类型
    'scope-empty': [0], // 不校验scope是否设置
    'subject-empty': [0],// 不校验描述是否设置
    'subject-case': [0], // 不校验描述的字符格式
    'subject-min-length': [2, 'always', 5], // 描述至少5个字符
  },
};
