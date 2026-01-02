// 渲染项目列表
function renderProjects(projects) {
    const projectsContainer = document.querySelector('.projects-list');
    
    if (!projectsContainer) {
        console.error('Projects container not found');
        return;
    }
    
    // 清空现有内容
    projectsContainer.innerHTML = '';
    
    // 渲染每个项目卡片
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        
        // 构建项目内容
        let cardContent = '';
        
        // 如果有图片，添加图片
        if (project.image) {
            cardContent += `<img src="${project.image}" alt="${project.title}">`;
        }
        
        cardContent += `
            <div class="project-content">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
        `;
        
        // 如果有链接，添加链接
        if (project.link) {
            cardContent += `
                <a href="${project.link}" target="_blank" class="project-link">查看项目 →</a>
            `;
        }
        
        cardContent += `</div>`;
        
        card.innerHTML = cardContent;
        projectsContainer.appendChild(card);
    });
}

// 加载并渲染项目列表
async function loadProjects() {
    const projectsContainer = document.querySelector('.projects-list');
    
    try {
        // 从 projects.json 文件加载
        const response = await fetch('projects/projects.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const projects = await response.json();
        
        if (!Array.isArray(projects)) {
            throw new Error('projects.json is not a valid array');
        }
        
        renderProjects(projects);
    } catch (error) {
        console.error('Error loading projects:', error);
        
        // 显示友好的错误提示
        if (projectsContainer) {
            let errorMessage = '加载项目列表失败。';
            
            // 如果是本地文件协议，提示使用本地服务器
            if (window.location.protocol === 'file:') {
                errorMessage += '<br><br>💡 提示：请在本地服务器环境下运行（如使用 VS Code Live Server 或 Python http.server），<br>或者将网站部署到 GitHub Pages 等在线环境。';
            } else {
                errorMessage += '<br>请检查 projects/projects.json 文件是否存在且格式正确。';
            }
            
            projectsContainer.innerHTML = `
                <p style="color: #888; padding: 20px; text-align: center;">
                    ${errorMessage}
                </p>
            `;
        }
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', loadProjects);

