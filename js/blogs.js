// 渲染博客列表
function renderBlogs(blogs) {
    const blogList = document.querySelector('.blog-list');
    
    if (!blogList) {
        console.error('Blog list container not found');
        return;
    }
    
    // 按日期降序排序（最新的在前）
    blogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 清空现有内容
    blogList.innerHTML = '';
    
    // 渲染每个博客项
    blogs.forEach(blog => {
        const article = document.createElement('article');
        article.className = 'blog-item';
        
        // 判断链接方式：如果是 HTML 文件，直接链接；否则使用查看器
        const isHTML = blog.filename.endsWith('.html') && blog.type !== 'markdown';
        const blogUrl = isHTML ? blog.filename : `blogs/blog-viewer.html?file=${encodeURIComponent(blog.filename)}`;
        
        article.innerHTML = `
            <h3>
                <a href="${blogUrl}">${blog.title}</a>
            </h3>
            <p class="blog-meta">${blog.date} · ${blog.category}</p>
            <p class="blog-summary">
                ${blog.summary}
            </p>
        `;
        
        blogList.appendChild(article);
    });
}

// 加载并渲染博客列表
async function loadBlogs() {
    const blogList = document.querySelector('.blog-list');
    
    try {
        // 从 blogs.json 文件加载
        const response = await fetch('blogs/blogs.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blogs = await response.json();
        
        if (!Array.isArray(blogs)) {
            throw new Error('blogs.json is not a valid array');
        }
        
        renderBlogs(blogs);
    } catch (error) {
        console.error('Error loading blogs:', error);
        
        // 显示友好的错误提示
        if (blogList) {
            let errorMessage = '加载博客列表失败。';
            
            // 如果是本地文件协议，提示使用本地服务器
            if (window.location.protocol === 'file:') {
                errorMessage += '<br><br>💡 提示：请在本地服务器环境下运行（如使用 VS Code Live Server 或 Python http.server），<br>或者将网站部署到 GitHub Pages 等在线环境。';
            } else {
                errorMessage += '<br>请检查 blogs.json 文件是否存在且格式正确。';
            }
            
            blogList.innerHTML = `
                <p style="color: #888; padding: 20px; text-align: center;">
                    ${errorMessage}
                </p>
            `;
        }
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', loadBlogs);

