// 从 URL 参数获取博客文件名
function getBlogFilename() {
    const params = new URLSearchParams(window.location.search);
    return params.get('file') || '';
}

// 加载博客内容
async function loadBlog() {
    const filename = getBlogFilename();
    const blogTitle = document.getElementById('blog-title');
    const blogMeta = document.getElementById('blog-meta');
    const blogBody = document.getElementById('blog-body');
    
    if (!filename) {
        blogBody.innerHTML = '<p style="color: #888; text-align: center;">未指定博客文件</p>';
        return;
    }
    
    try {
        // 首先从 blogs.json 获取博客元数据
        const blogsResponse = await fetch('../blogs/blogs.json');
        if (!blogsResponse.ok) {
            throw new Error('Failed to load blogs.json');
        }
        
        const blogs = await blogsResponse.json();
        const blog = blogs.find(b => b.filename === filename || b.filename.endsWith(filename));
        
        if (!blog) {
            throw new Error('Blog not found in blogs.json');
        }
        
        // 设置标题和元数据
        blogTitle.textContent = blog.title;
        blogMeta.textContent = `${blog.date} · ${blog.category}`;
        
        // 判断是 HTML 还是 Markdown
        const isMarkdown = filename.endsWith('.md') || blog.type === 'markdown';
        const isHTML = filename.endsWith('.html') && blog.type !== 'markdown';
        
        // 加载博客内容
        const contentResponse = await fetch(`../${filename}`);
        if (!contentResponse.ok) {
            throw new Error(`Failed to load blog file: ${filename}`);
        }
        
        if (isMarkdown) {
            // Markdown 文件
            const markdown = await contentResponse.text();
            if (typeof marked !== 'undefined') {
                // 配置 marked 选项
                marked.setOptions({
                    breaks: true,
                    gfm: true
                });
                
                // 保护数学公式，避免被 marked 转义
                const mathBlocks = [];
                let mathCounter = 0;
                
                // 先处理块级公式 $$...$$
                let processedMarkdown = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
                    const id = `MATH_BLOCK_${mathCounter++}`;
                    mathBlocks.push({ id, formula: formula.trim(), type: 'block' });
                    return `\n\n${id}\n\n`;
                });
                
                // 再处理行内公式 $...$（但要避免匹配到 $$）
                processedMarkdown = processedMarkdown.replace(/(?<!\$)\$([^\$\n]+?)\$(?!\$)/g, (match, formula) => {
                    const id = `MATH_INLINE_${mathCounter++}`;
                    mathBlocks.push({ id, formula: formula.trim(), type: 'inline' });
                    return id;
                });
                
                // 解析 Markdown
                blogBody.innerHTML = marked.parse(processedMarkdown);
                
                // 渲染数学公式
                const renderMath = () => {
                    if (typeof katex === 'undefined') {
                        // KaTeX 未加载，等待后重试
                        setTimeout(renderMath, 100);
                        return;
                    }
                    
                    mathBlocks.forEach(({ id, formula, type }) => {
                        // 查找包含占位符的文本节点
                        const walker = document.createTreeWalker(
                            blogBody,
                            NodeFilter.SHOW_TEXT,
                            null
                        );
                        
                        let textNode;
                        while (textNode = walker.nextNode()) {
                            if (textNode.textContent.includes(id)) {
                                const parent = textNode.parentElement;
                                const text = textNode.textContent;
                                const parts = text.split(id);
                                
                                // 创建新的 DOM 结构
                                const fragment = document.createDocumentFragment();
                                
                                if (parts[0]) {
                                    fragment.appendChild(document.createTextNode(parts[0]));
                                }
                                
                                const mathSpan = document.createElement('span');
                                try {
                                    katex.render(formula, mathSpan, {
                                        displayMode: type === 'block',
                                        throwOnError: false
                                    });
                                    if (type === 'block') {
                                        mathSpan.style.display = 'block';
                                        mathSpan.style.margin = '16px 0';
                                        mathSpan.style.textAlign = 'center';
                                    }
                                    fragment.appendChild(mathSpan);
                                } catch (e) {
                                    console.error('KaTeX error:', e);
                                    const errorSpan = document.createTextNode(
                                        type === 'block' ? `$$${formula}$$` : `$${formula}$`
                                    );
                                    fragment.appendChild(errorSpan);
                                }
                                
                                if (parts[1]) {
                                    fragment.appendChild(document.createTextNode(parts[1]));
                                }
                                
                                parent.replaceChild(fragment, textNode);
                                break;
                            }
                        }
                    });
                };
                
                // 等待 KaTeX 加载完成后渲染
                if (typeof katex !== 'undefined') {
                    renderMath();
                } else {
                    // 如果 KaTeX 是 defer 加载，等待 DOMContentLoaded 后再渲染
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', renderMath);
                    } else {
                        // 轮询等待 KaTeX 加载
                        const checkKaTeX = setInterval(() => {
                            if (typeof katex !== 'undefined') {
                                clearInterval(checkKaTeX);
                                renderMath();
                            }
                        }, 50);
                        // 10秒后停止检查
                        setTimeout(() => clearInterval(checkKaTeX), 10000);
                    }
                }
            } else {
                blogBody.innerHTML = `<pre style="white-space: pre-wrap;">${markdown}</pre>`;
            }
        } else {
            // HTML 文件，直接重定向到原文件
            window.location.href = `../${filename}`;
            return;
        }
        
        // 添加代码高亮样式（如果需要）
        const codeBlocks = blogBody.querySelectorAll('pre code');
        if (codeBlocks.length > 0) {
            // 可以在这里添加代码高亮库，如 Prism.js 或 highlight.js
        }
        
    } catch (error) {
        console.error('Error loading blog:', error);
        blogBody.innerHTML = `
            <p style="color: #888; text-align: center; padding: 40px;">
                加载博客失败：${error.message}<br><br>
                <a href="../blogs.html">返回博客列表</a>
            </p>
        `;
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', loadBlog);

