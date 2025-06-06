// --- Globals ---
let globalSettings = {
    sidebarWidth: 260, // Default left sidebar width
    notificationsSidebarWidth: 300 // Default right notifications sidebar width
};
let currentAgentId = null;
let currentTopicId = null; 
let currentChatHistory = []; 
let attachedFiles = []; 
let activeStreamingMessageId = null; 

// --- Topic Search Functionality ---
async function filterTopicList() {
    const topicSearchInputElement = document.getElementById('topicSearchInput'); 
    if (!topicSearchInputElement) {
        console.error("[filterTopicList] topicSearchInput element not found.");
        return;
    }
    const searchTerm = topicSearchInputElement.value.toLowerCase();
    const topicListUl = document.getElementById('topicList'); 
    const topicItems = topicListUl ? topicListUl.querySelectorAll('.topic-item') : [];

    if (!currentAgentId) {
        topicItems.forEach(item => item.style.display = searchTerm.length === 0 ? '' : 'none');
        return;
    }

    const agentConfig = await window.electronAPI.getAgentConfig(currentAgentId);
    if (!agentConfig || agentConfig.error) {
        console.error("[filterTopicList] Failed to get agent config for topic search:", agentConfig?.error);
        return;
    }
    const allTopics = agentConfig.topics || [];

    for (const item of topicItems) {
        const topicId = item.dataset.topicId;
        const topic = allTopics.find(t => t.id === topicId);
        if (!topic) {
            item.style.display = 'none';
            continue;
        }

        const topicTitle = (topic.name || '').toLowerCase();
        let contentMatches = false;
        let dateMatches = false;


        if (searchTerm.length > 0) {
            if (topic.createdAt) {
                const date = new Date(topic.createdAt);
                const year = date.getFullYear().toString();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');

                const fullDateTime = `${year}-${month}-${day} ${hours}:${minutes}`;
                const justDate = `${year}-${month}-${day}`;
                const monthDay = `${month}-${day}`;
                
                const dateStringsToSearch = [
                    fullDateTime,
                    justDate,
                    monthDay,
                    year,
                    hours,
                    minutes,
                    `${hours}:${minutes}`
                ];

                dateMatches = dateStringsToSearch.some(ds => ds.toLowerCase().includes(searchTerm));
            }

            if (!topicTitle.includes(searchTerm) && !dateMatches) {
                const history = await window.electronAPI.getChatHistory(currentAgentId, topicId);
                if (history && !history.error) {
                    contentMatches = history.some(msg => {
                        const messageContent = msg.content && typeof msg.content === 'string' ? msg.content.toLowerCase() : '';
                        const attachmentsText = msg.attachments ? msg.attachments.some(att =>
                            att.extractedText && typeof att.extractedText === 'string' && att.extractedText.toLowerCase().includes(searchTerm)
                        ) : false;
                        return messageContent.includes(searchTerm) || attachmentsText;
                    });
                }
            }
        }

        if (topicTitle.includes(searchTerm) || contentMatches || dateMatches) {
            item.style.display = ''; 
        } else {
            item.style.display = 'none'; 
        }
    }
}

function setupTopicSearch() {
    const topicSearchInputElement = document.getElementById('topicSearchInput');
    if (topicSearchInputElement) {
        topicSearchInputElement.addEventListener('input', filterTopicList); 
        topicSearchInputElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                filterTopicList();
            }
        });
    } else {
        console.error('[Renderer] Global Topic search input element (topicSearchInput) not found during setup.');
    }
}
// --- DOM Elements ---
const agentListUl = document.getElementById('agentList');
const currentChatAgentNameH3 = document.getElementById('currentChatAgentName');
const chatMessagesDiv = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const attachFileBtn = document.getElementById('attachFileBtn');
const attachmentPreviewArea = document.getElementById('attachmentPreviewArea');

const globalSettingsBtn = document.getElementById('globalSettingsBtn');
const globalSettingsModal = document.getElementById('globalSettingsModal');
const globalSettingsForm = document.getElementById('globalSettingsForm');
const userAvatarInput = document.getElementById('userAvatarInput'); // New
const userAvatarPreview = document.getElementById('userAvatarPreview'); // New

const createNewAgentBtn = document.getElementById('createNewAgentBtn');

const agentSettingsContainerTitle = document.getElementById('agentSettingsContainerTitle'); 
const selectedAgentNameForSettingsSpan = document.getElementById('selectedAgentNameForSettings');
const agentSettingsForm = document.getElementById('agentSettingsForm'); 
const agentSettingsContainer = document.getElementById('agentSettingsContainer');
const selectAgentPromptForSettings = document.getElementById('selectAgentPromptForSettings');
const editingAgentIdInput = document.getElementById('editingAgentId');
const agentNameInput = document.getElementById('agentNameInput');
const agentAvatarInput = document.getElementById('agentAvatarInput');
const agentAvatarPreview = document.getElementById('agentAvatarPreview');
const agentSystemPromptTextarea = document.getElementById('agentSystemPrompt');
const agentModelInput = document.getElementById('agentModel');
const agentTemperatureInput = document.getElementById('agentTemperature');
const agentContextTokenLimitInput = document.getElementById('agentContextTokenLimit');
const agentMaxOutputTokensInput = document.getElementById('agentMaxOutputTokens');
const deleteAgentBtn = document.getElementById('deleteAgentBtn');
const currentAgentSettingsBtn = document.getElementById('currentAgentSettingsBtn');
const clearCurrentChatBtn = document.getElementById('clearCurrentChatBtn');
const openAdminPanelBtn = document.getElementById('openAdminPanelBtn'); 
const themeToggleBtn = document.getElementById('themeToggleBtn');
const toggleNotificationsBtn = document.getElementById('toggleNotificationsBtn'); 


const notificationsSidebar = document.getElementById('notificationsSidebar');
const vcpLogConnectionStatusDiv = document.getElementById('vcpLogConnectionStatus');
const notificationsListUl = document.getElementById('notificationsList');
const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');

const sidebarTabButtons = document.querySelectorAll('.sidebar-tab-button');
const sidebarTabContents = document.querySelectorAll('.sidebar-tab-content');
const tabContentTopics = document.getElementById('tabContentTopics');

const topicSearchInput = document.getElementById('topicSearchInput');
const topicSearchBtn = document.getElementById('topicSearchBtn');

const leftSidebar = document.querySelector('.sidebar');
const rightNotificationsSidebar = document.getElementById('notificationsSidebar');
const resizerLeft = document.getElementById('resizerLeft');
const resizerRight = document.getElementById('resizerRight');

const minimizeBtn = document.getElementById('minimize-btn');
const maximizeBtn = document.getElementById('maximize-btn');
const restoreBtn = document.getElementById('restore-btn');
const closeBtn = document.getElementById('close-btn');
const settingsBtn = document.getElementById('settings-btn');

let croppedAvatarFile = null; // To store the result from the avatar cropper
let croppedUserAvatarFile = null; // For user avatar

const notificationTitleElement = document.getElementById('notificationTitle');
const digitalClockElement = document.getElementById('digitalClock');
const dateDisplayElement = document.getElementById('dateDisplay');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    window.electronAPI.onVCPLogStatus((statusUpdate) => {
        if (window.notificationRenderer) {
            window.notificationRenderer.updateVCPLogStatus(statusUpdate, vcpLogConnectionStatusDiv);
        }
    });
    window.electronAPI.onVCPLogMessage((logData, originalRawMessage) => {
        if (window.notificationRenderer) {
            const computedStyle = getComputedStyle(document.body);
            const themeColors = {
                notificationBg: computedStyle.getPropertyValue('--notification-bg').trim(),
                accentBg: computedStyle.getPropertyValue('--accent-bg').trim(),
                highlightText: computedStyle.getPropertyValue('--highlight-text').trim(),
                borderColor: computedStyle.getPropertyValue('--border-color').trim(),
                primaryText: computedStyle.getPropertyValue('--primary-text').trim(),
                secondaryText: computedStyle.getPropertyValue('--secondary-text').trim()
            };
            window.notificationRenderer.renderVCPLogNotification(logData, originalRawMessage, notificationsListUl, themeColors);
        }
    });
 
    window.electronAPI.onVCPStreamChunk(async (eventData) => {
        if (!window.messageRenderer) {
            console.error("VCPStreamChunk: messageRenderer not available.");
            return;
        }
 
        const streamMessageId = eventData.messageId;
 
        if (!streamMessageId) {
            console.error("VCPStreamChunk: Received chunk/event without a messageId. Cannot process.", eventData);
            if (activeStreamingMessageId) {
                window.messageRenderer.finalizeStreamedMessage(activeStreamingMessageId, 'error_missing_id');
                const errorMsgItem = document.querySelector(`.message-item[data-message-id="${activeStreamingMessageId}"] .md-content`);
                if (errorMsgItem) errorMsgItem.innerHTML += `<p><strong style="color: red;">流错误: 响应中缺少messageId</strong></p>`;
                activeStreamingMessageId = null;
            }
            return;
        }
 
        if (eventData.type === 'data') {
            window.messageRenderer.appendStreamChunk(streamMessageId, eventData.chunk);
        } else if (eventData.type === 'end') {
            window.messageRenderer.finalizeStreamedMessage(streamMessageId, eventData.finish_reason || 'completed');
            await attemptTopicSummarizationIfNeeded();
            if (activeStreamingMessageId === streamMessageId) {
                activeStreamingMessageId = null; 
            } else {
                console.warn(`VCPStreamChunk: Finalized stream ${streamMessageId}, but global activeStreamingMessageId was ${activeStreamingMessageId}.`);
            }
        } else if (eventData.type === 'error') {
            console.error('VCP Stream Error on ID', streamMessageId, ':', eventData.error);
            window.messageRenderer.finalizeStreamedMessage(streamMessageId, 'error');
            const errorMsgItem = document.querySelector(`.message-item[data-message-id="${streamMessageId}"] .md-content`);
            if (errorMsgItem) {
                errorMsgItem.innerHTML += `<p><strong style="color: red;">流错误: ${eventData.error}</strong></p>`;
            } else {
                 window.messageRenderer.renderMessage({
                    role: 'system',
                    content: `流处理错误 (ID: ${streamMessageId}): ${eventData.error}`,
                    timestamp: Date.now(),
                    id: `err_${streamMessageId}` 
                });
            }
            if (activeStreamingMessageId === streamMessageId) {
                activeStreamingMessageId = null;
            }
        }
    });
  
    try {
        await loadAndApplyGlobalSettings();
        await loadAgentList();
 
        if (window.messageRenderer) {
            window.messageRenderer.initializeMessageRenderer({
                currentChatHistory: currentChatHistory,
                currentAgentId: currentAgentId,
                currentTopicId: currentTopicId, 
                globalSettings: globalSettings,
                chatMessagesDiv: chatMessagesDiv,
                electronAPI: window.electronAPI,
                markedInstance: markedInstance,
                scrollToBottom: scrollToBottom,
                summarizeTopicFromMessages: summarizeTopicFromMessages,
                openModal: openModal,
                autoResizeTextarea: autoResizeTextarea,
                handleCreateBranch: handleCreateBranch
            });
        } else {
            console.error('[RENDERER_INIT] messageRenderer module not found!');
        }

        if (window.inputEnhancer) {
            window.inputEnhancer.initializeInputEnhancer({
                messageInput: messageInput,
                electronAPI: window.electronAPI,
                attachedFiles: attachedFiles,
                updateAttachmentPreview: updateAttachmentPreview,
                getCurrentAgentId: () => currentAgentId,
                getCurrentTopicId: () => currentTopicId
            });
        } else {
            console.error('[RENDERER_INIT] inputEnhancer module not found! Drag/drop and enhanced paste might not work.');
        }
 
        setupEventListeners();
        setupSidebarTabs();
        initializeResizers();
        setupTitleBarControls();
        setupTopicSearch();
        autoResizeTextarea(messageInput);
        loadAndApplyThemePreference();
        initializeDigitalClock();

    } catch (error) {
        console.error('Error during DOMContentLoaded initialization:', error);
    }
});

function initializeDigitalClock() {
    if (digitalClockElement && notificationTitleElement && dateDisplayElement) {
        notificationTitleElement.style.display = 'none'; 
        updateDateTimeDisplay(); 
        setInterval(updateDateTimeDisplay, 1000); 
    } else {
        console.error('Digital clock, notification title, or date display element not found.');
    }
}

function updateDateTimeDisplay() {
    const now = new Date();
    if (digitalClockElement) {
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        if (!digitalClockElement.querySelector('.colon')) {
            digitalClockElement.innerHTML = `<span class="hours">${hours}</span><span class="colon">:</span><span class="minutes">${minutes}</span>`;
        } else {
            const hoursSpan = digitalClockElement.querySelector('.hours');
            const minutesSpan = digitalClockElement.querySelector('.minutes');
            if (hoursSpan) hoursSpan.textContent = hours;
            if (minutesSpan) minutesSpan.textContent = minutes;
        }
    }
    if (dateDisplayElement) {
        const month = String(now.getMonth() + 1).padStart(2, '0'); 
        const day = String(now.getDate()).padStart(2, '0');
        const dayOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
        dateDisplayElement.textContent = `${month}-${day} ${dayOfWeek}`;
    }
}

function loadAndApplyThemePreference() {
    const currentTheme = localStorage.getItem('theme');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'inline-block'; 
    } else {
        document.body.classList.remove('light-theme'); 
        if (sunIcon) sunIcon.style.display = 'inline-block'; 
        if (moonIcon) moonIcon.style.display = 'none';
    }
}

async function loadAndApplyGlobalSettings() {
    const settings = await window.electronAPI.loadSettings();
    if (settings && !settings.error) {
        globalSettings = { ...globalSettings, ...settings }; // Merge with defaults, saved settings take precedence

        document.getElementById('userName').value = globalSettings.userName || '';
        document.getElementById('vcpServerUrl').value = globalSettings.vcpServerUrl || '';
        document.getElementById('vcpApiKey').value = globalSettings.vcpApiKey || '';
        document.getElementById('vcpLogUrl').value = globalSettings.vcpLogUrl || '';
        document.getElementById('vcpLogKey').value = globalSettings.vcpLogKey || '';

        if (globalSettings.userAvatarUrl && userAvatarPreview) {
            userAvatarPreview.src = globalSettings.userAvatarUrl;
            userAvatarPreview.style.display = 'block';
            // Always set the user avatar color from settings, even if it's null (to reset)
            if (window.messageRenderer) {
                window.messageRenderer.setUserAvatarColor(globalSettings.userAvatarCalculatedColor);
            }
        } else if (window.messageRenderer) { // If no avatar URL, ensure color state is also null
            window.messageRenderer.setUserAvatarColor(null);
        } else if (userAvatarPreview) {
            userAvatarPreview.src = '#';
            userAvatarPreview.style.display = 'none';
        }
        if (window.messageRenderer) { // Update message renderer with user avatar
            window.messageRenderer.setUserAvatar(globalSettings.userAvatarUrl);
        }


        // Apply saved sidebar widths
        if (globalSettings.sidebarWidth && leftSidebar) {
            leftSidebar.style.width = `${globalSettings.sidebarWidth}px`;
        }
        if (globalSettings.notificationsSidebarWidth && rightNotificationsSidebar) {
             // Only apply if the sidebar is currently active or intended to be shown with a saved width
            if (rightNotificationsSidebar.classList.contains('active')) {
                rightNotificationsSidebar.style.width = `${globalSettings.notificationsSidebarWidth}px`;
            }
        }


        if (globalSettings.vcpLogUrl && globalSettings.vcpLogKey) {
            if (window.notificationRenderer) window.notificationRenderer.updateVCPLogStatus({ status: 'connecting', message: '连接中...' }, vcpLogConnectionStatusDiv);
            window.electronAPI.connectVCPLog(globalSettings.vcpLogUrl, globalSettings.vcpLogKey);
        } else {
            if (window.notificationRenderer) window.notificationRenderer.updateVCPLogStatus({ status: 'error', message: 'VCPLog未配置' }, vcpLogConnectionStatusDiv);
        }
    } else {
        console.warn('加载全局设置失败或无设置:', settings?.error);
        if (window.notificationRenderer) window.notificationRenderer.updateVCPLogStatus({ status: 'error', message: 'VCPLog未配置' }, vcpLogConnectionStatusDiv);
    }
}

// --- Agent Management ---
async function loadAgentList() {
    agentListUl.innerHTML = '<li>加载中...</li>';
    const result = await window.electronAPI.getAgents();
    agentListUl.innerHTML = ''; 
    if (result.error) {
        agentListUl.innerHTML = `<li>加载Agent失败: ${result.error}</li>`;
        return;
    }
    if (result.length === 0) {
        agentListUl.innerHTML = '<li>没有找到Agent。请创建一个。</li>';
    } else {
        result.forEach(agent => {
            const li = document.createElement('li');
            li.dataset.agentId = agent.id;
            
            const avatarImg = document.createElement('img');
            avatarImg.classList.add('avatar');
            avatarImg.src = agent.avatarUrl ? `${agent.avatarUrl}?t=${Date.now()}` : 'assets/default_avatar.png';
            avatarImg.alt = `${agent.name} 头像`;
            avatarImg.onerror = () => { avatarImg.src = 'assets/default_avatar.png'; }; 

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('agent-name');
            nameSpan.textContent = agent.name;

            li.appendChild(avatarImg);
            li.appendChild(nameSpan);
            li.addEventListener('click', () => selectAgent(agent.id, agent.name));
            agentListUl.appendChild(li);
        });
        if (currentAgentId) {
            highlightActiveAgent(currentAgentId);
        }

        if (typeof Sortable !== 'undefined') {
            new Sortable(agentListUl, {
                animation: 150,
                ghostClass: 'sortable-ghost', 
                chosenClass: 'sortable-chosen', 
                dragClass: 'sortable-drag', 
                onEnd: async function (evt) {
                    const agentItems = Array.from(evt.to.children);
                    const orderedAgentIds = agentItems.map(item => item.dataset.agentId);
                    try {
                        const result = await window.electronAPI.saveAgentOrder(orderedAgentIds);
                        if (result && result.success) {
                        } else {
                            console.error('Failed to save agent order:', result?.error);
                            alert('保存助手顺序失败: ' + (result?.error || '未知错误'));
                            loadAgentList();
                        }
                    } catch (error) {
                        console.error('Error calling saveAgentOrder:', error);
                        alert('调用保存助手顺序API时出错: ' + error.message);
                        loadAgentList();
                    }
                }
            });
        } else {
            console.warn('SortableJS library not found. Agent list drag-and-drop ordering will not be available.');
        }
    }
}
 
async function selectAgent(agentId, agentName) { // agentName is already a parameter
    if (currentAgentId === agentId && currentTopicId) {
        return;
    }
 
    currentAgentId = agentId;
    // currentAgentName = agentName; // Update local state if you use it elsewhere in renderer.js
    currentTopicId = null;
    currentChatHistory = [];
 
    document.querySelectorAll('.topic-list .topic-item.active-topic-glowing').forEach(item => {
        item.classList.remove('active-topic-glowing');
    });
 
    if (window.messageRenderer) {
        window.messageRenderer.setCurrentAgentId(currentAgentId);
        window.messageRenderer.setCurrentAgentName(agentName); // <--- ADD THIS CALL
        window.messageRenderer.setCurrentTopicId(null);
        // Fetch agent details to get avatar
        const agentData = (await window.electronAPI.getAgents()).find(a => a.id === agentId);
        if (agentData) {
            window.messageRenderer.setCurrentAgentAvatar(agentData.avatarUrl);
            if (agentData.config && agentData.config.avatarCalculatedColor) { // Load persisted color for the agent
                window.messageRenderer.setCurrentAgentAvatarColor(agentData.config.avatarCalculatedColor);
            } else {
                window.messageRenderer.setCurrentAgentAvatarColor(null); // Explicitly set to null if not in config
            }
        } else {
            window.messageRenderer.setCurrentAgentAvatar(null); // Fallback to default
            window.messageRenderer.setCurrentAgentAvatarColor(null);
        }
    }
    currentChatAgentNameH3.textContent = `与 ${agentName} 聊天中`;
    
    currentAgentSettingsBtn.textContent = '新建上下文';
    currentAgentSettingsBtn.title = `为 ${agentName} 新建聊天上下文(话题)`;
    currentAgentSettingsBtn.style.display = 'inline-block';
    clearCurrentChatBtn.style.display = 'inline-block';
 
    highlightActiveAgent(agentId);

    try {
        const topics = await window.electronAPI.getAgentTopics(agentId);
        if (topics && !topics.error && topics.length > 0) {
            let topicToLoadId = topics[0].id; 
            try {
                const rememberedTopicId = localStorage.getItem(`lastActiveTopic_${agentId}`);
                if (rememberedTopicId && topics.some(t => t.id === rememberedTopicId)) {
                    topicToLoadId = rememberedTopicId;
                }
            } catch (e) {
                console.warn("Failed to read last active topic from localStorage:", e);
            }
            currentTopicId = topicToLoadId;
            if (window.messageRenderer) {
                window.messageRenderer.setCurrentTopicId(currentTopicId);
            }
            await loadChatHistory(currentAgentId, currentTopicId);
        } else if (topics.error) {
            console.error(`加载Agent ${agentId} 的话题列表失败:`, topics.error);
            chatMessagesDiv.innerHTML = `<div class="message-item system"><div class="sender-name">系统</div><div>加载话题列表失败: ${topics.error}</div></div>`;
        } else {
            await loadChatHistory(currentAgentId, null); // This will show "no topic" message
        }
    } catch (e) {
        console.error(`选择 Agent ${agentId} 时发生错误: `, e);
        chatMessagesDiv.innerHTML = `<div class="message-item system"><div class="sender-name">系统</div><div>选择助手时出错: ${e.message}</div></div>`;
    }
    
    messageInput.disabled = false;
    sendMessageBtn.disabled = false;
    attachFileBtn.disabled = false;
    messageInput.focus();
}
 
function highlightActiveAgent(agentId) {
    document.querySelectorAll('.agent-list li').forEach(item => {
        item.classList.toggle('active', item.dataset.agentId === agentId);
    });
    if (!currentTopicId) {
        document.querySelectorAll('.topic-list .topic-item.active-topic-glowing').forEach(item => {
            item.classList.remove('active-topic-glowing');
        });
    }
}

// --- Chat Functionality ---
async function loadChatHistory(agentId, topicId) {
    chatMessagesDiv.innerHTML = '';
    currentChatHistory = [];

    document.querySelectorAll('.topic-list .topic-item').forEach(item => {
        const isCurrent = item.dataset.topicId === topicId && item.dataset.agentId === agentId;
        item.classList.toggle('active', isCurrent); 
        item.classList.toggle('active-topic-glowing', isCurrent); 
    });

    if (window.messageRenderer) {
        window.messageRenderer.setCurrentTopicId(topicId);
    }

    if (!agentId || !topicId) {
        const errorMsg = `错误：无法加载聊天记录，助手ID (${agentId}) 或话题ID (${topicId}) 缺失。`;
        console.error(errorMsg);
        if (window.messageRenderer) {
             window.messageRenderer.initializeMessageRenderer({ currentChatHistory, currentAgentId, currentTopicId: topicId, globalSettings, chatMessagesDiv, electronAPI, markedInstance, scrollToBottom, summarizeTopicFromMessages, openModal, autoResizeTextarea, handleCreateBranch });
            window.messageRenderer.renderMessage({ role: 'system', content: errorMsg, timestamp: Date.now() });
        } else {
            chatMessagesDiv.innerHTML = `<div class="message-item system"><div class="sender-name">系统</div><div>${errorMsg}</div></div>`;
        }
        return;
    }

    const loadingMessageDiv = document.createElement('div');
    loadingMessageDiv.className = 'message-item assistant';
    loadingMessageDiv.innerHTML = '<div class="sender-name">系统</div><div>加载聊天记录中...</div>';
    chatMessagesDiv.appendChild(loadingMessageDiv);

    const result = await window.electronAPI.getChatHistory(agentId, topicId);
    loadingMessageDiv.remove();

    await displayTopicTimestampBubble(agentId, topicId);

    if (result.error) {
        if (window.messageRenderer) {
            window.messageRenderer.initializeMessageRenderer({ currentChatHistory, currentAgentId, currentTopicId: topicId, globalSettings, chatMessagesDiv, electronAPI, markedInstance, scrollToBottom, summarizeTopicFromMessages, openModal, autoResizeTextarea, handleCreateBranch });
            window.messageRenderer.renderMessage({ role: 'system', content: `加载话题 "${topicId}" 的聊天记录失败: ${result.error}`, timestamp: Date.now() });
        }
    } else {
        currentChatHistory = result;
        if (window.messageRenderer) {
             window.messageRenderer.initializeMessageRenderer({ currentChatHistory, currentAgentId, currentTopicId: topicId, globalSettings, chatMessagesDiv, electronAPI, markedInstance, scrollToBottom, summarizeTopicFromMessages, openModal, autoResizeTextarea, handleCreateBranch });
            currentChatHistory.forEach(msg => window.messageRenderer.renderMessage(msg, true));
        }
    }
    scrollToBottom();
    if (agentId && topicId && !result.error) {
        localStorage.setItem(`lastActiveTopic_${agentId}`, topicId);
    }
}
 
function scrollToBottom() {
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    const parentContainer = document.querySelector('.chat-messages-container');
    if (parentContainer) {
        parentContainer.scrollTop = parentContainer.scrollHeight;
    }
}

async function displayTopicTimestampBubble(agentId, topicId) {
    const chatMessagesContainer = document.querySelector('.chat-messages-container'); 
    const chatMessagesDivElement = document.getElementById('chatMessages'); 

    if (!chatMessagesDivElement || !chatMessagesContainer) {
        console.warn('[displayTopicTimestampBubble] Missing chatMessagesDivElement or chatMessagesContainer.');
        const existingBubble = document.getElementById('topicTimestampBubble');
        if (existingBubble) existingBubble.style.display = 'none';
        return;
    }

    let timestampBubble = document.getElementById('topicTimestampBubble');
    if (!timestampBubble) {
        timestampBubble = document.createElement('div');
        timestampBubble.id = 'topicTimestampBubble';
        timestampBubble.className = 'topic-timestamp-bubble';
        if (chatMessagesDivElement.firstChild) {
            chatMessagesDivElement.insertBefore(timestampBubble, chatMessagesDivElement.firstChild);
        } else {
            chatMessagesDivElement.appendChild(timestampBubble);
        }
    } else {
        if (chatMessagesDivElement.firstChild !== timestampBubble) {
            chatMessagesDivElement.insertBefore(timestampBubble, chatMessagesDivElement.firstChild);
        }
    }


    if (!agentId || !topicId) {
        timestampBubble.style.display = 'none';
        return;
    }

    try {
        const agentConfig = await window.electronAPI.getAgentConfig(agentId);
        if (agentConfig && !agentConfig.error && agentConfig.topics) {
            const currentTopic = agentConfig.topics.find(t => t.id === topicId);
            if (currentTopic && currentTopic.createdAt) {
                const date = new Date(currentTopic.createdAt);
                const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                timestampBubble.textContent = `话题创建于: ${formattedDate}`;
                timestampBubble.style.display = 'block'; 
            } else {
                console.warn(`[displayTopicTimestampBubble] Topic ${topicId} not found or has no createdAt timestamp for agent ${agentId}.`);
                timestampBubble.style.display = 'none';
            }
        } else {
            console.error('[displayTopicTimestampBubble] Could not load agent config or topics for agent', agentId, 'Error:', agentConfig?.error);
            timestampBubble.style.display = 'none';
        }
    } catch (error) {
        console.error('[displayTopicTimestampBubble] Error fetching topic creation time for agent', agentId, 'topic', topicId, ':', error);
        timestampBubble.style.display = 'none';
    }
}


async function attemptTopicSummarizationIfNeeded() {
    if (currentChatHistory.length >= 4 && currentTopicId) {
        try {
            const agentConfigForSummary = await window.electronAPI.getAgentConfig(currentAgentId);
            if (!agentConfigForSummary || agentConfigForSummary.error) {
                console.error('[TopicSummary] Failed to get agent config for summarization:', agentConfigForSummary?.error);
                return;
            }
            const topics = agentConfigForSummary.topics || [];
            const currentTopicObject = topics.find(t => t.id === currentTopicId);
            const existingTopicTitle = currentTopicObject ? currentTopicObject.name : "主要对话";
            const currentAgentName = agentConfigForSummary.name || 'AI';

            if (existingTopicTitle === "主要对话" || existingTopicTitle.startsWith("新话题")) {
                if (typeof summarizeTopicFromMessages === 'function') {
                    const summarizedTitle = await summarizeTopicFromMessages(currentChatHistory.filter(m => !m.isThinking), currentAgentName);
                    if (summarizedTitle) {
                        const saveResult = await window.electronAPI.saveAgentTopicTitle(currentAgentId, currentTopicId, summarizedTitle);
                        if (saveResult.success) {
                            if (document.getElementById('tabContentTopics').classList.contains('active')) {
                                loadTopicList();
                            }
                        } else {
                            console.error(`[TopicSummary] Failed to save new topic title "${summarizedTitle}":`, saveResult.error);
                        }
                    } else {
                    }
                } else {
                    console.error('[TopicSummary] summarizeTopicFromMessages function is not defined or not accessible.');
                }
            }
        } catch (error) {
            console.error('[TopicSummary] Error during attemptTopicSummarizationIfNeeded:', error);
        }
    }
}

async function handleSendMessage() {
    const content = messageInput.value.trim();
    if (!content && attachedFiles.length === 0) return;
    if (!currentAgentId || !currentTopicId) { 
        alert('请先选择一个Agent和话题！');
        return;
    }
    if (!globalSettings.vcpServerUrl) {
        alert('请先在全局设置中配置VCP服务器URL！');
        openModal('globalSettingsModal');
        return;
    }
 
    const userMessage = {
        role: 'user',
        content: content,
        timestamp: Date.now(),
        id: `msg_${Date.now()}_user_${Math.random().toString(36).substring(2, 9)}`, 
        attachments: []
    };
    
    if (attachedFiles.length > 0) {
        userMessage.attachments = attachedFiles.map(af => ({
            type: af.file.type, 
            src: af.localPath,   
            name: af.originalName,
            size: af.file.size,
        }));
    }
 
    if (window.messageRenderer) {
        window.messageRenderer.renderMessage(userMessage); 
    }

    messageInput.value = '';
    attachedFiles.length = 0; 
    updateAttachmentPreview();
    autoResizeTextarea(messageInput);
    messageInput.focus();

    const thinkingMessageId = `msg_${Date.now()}_assistant_${Math.random().toString(36).substring(2, 9)}`;
    const thinkingMessage = {
        role: 'assistant',
        content: '思考中...',
        timestamp: Date.now(),
        id: thinkingMessageId,
        isThinking: true
    };

    if (window.messageRenderer) {
        window.messageRenderer.renderMessage(thinkingMessage); 
    }
 
    try {
        const agentConfig = await window.electronAPI.getAgentConfig(currentAgentId);
        const historySnapshotForVCP = currentChatHistory.filter(msg => msg.id !== thinkingMessage.id && !msg.isThinking);
        
        const messagesForVCP = await Promise.all(historySnapshotForVCP.map(async msg => {
            let vcpAttachments = [];
            if (msg.attachments && msg.attachments.length > 0) {
                vcpAttachments = await Promise.all(msg.attachments.map(async att => {
                    if (att.type.startsWith('image/')) {
                        try {
                            const internalPath = att.src;
                            const base64Result = await window.electronAPI.getFileAsBase64(internalPath); // Check this line

                            // Updated error checking:
                            if (typeof base64Result === 'object' && base64Result !== null && base64Result.error) {
                                console.error(`[Renderer - handleSendMessage] Error from getFileAsBase64 for ${att.name} (internal: ${internalPath}):`, base64Result.error);
                                // Optionally add an error placeholder to the attachment or skip it
                                return { type: att.type, name: att.name, error: `Failed to load image data: ${base64Result.error}` };
                            } else if (typeof base64Result === 'string' && base64Result.length > 0) {
                                console.log(`[Renderer - handleSendMessage] Image ${att.name} - Base64 length: ${base64Result.length}`); // <<< ADD THIS LOG
                                return { type: att.type, name: att.name, data: base64Result, internalPath: internalPath };
                            } else {
                                console.warn(`[Renderer - handleSendMessage] getFileAsBase64 returned unexpected or empty data for ${att.name} (internal: ${internalPath}). Result:`, base64Result);
                                return { type: att.type, name: att.name, error: "Failed to load image data: Empty or unexpected result" };
                            }
                        } catch (error) {
                            console.error(`[Renderer - handleSendMessage] Exception during getBase64 for ${att.name} (internal: ${att.src}):`, error);
                            return { type: att.type, name: att.name, error: `Failed to load image data: ${error.message}` };
                        }
                    } else if (att.type.startsWith('text/') ||
                                 ['application/pdf',
                                  'application/msword',
                                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                  'application/javascript',
                                  'application/json',
                                 ].includes(att.type) ||
                                 /\.(txt|md|log|js|json|html|css|py|java|c|cpp|cs|go|rb|php|swift|kt|ts|sh|xml|yaml|toml)$/i.test(att.name)
                                ) {
                        try {
                            const internalPath = att.src;
                            const textResult = await window.electronAPI.getTextContent(internalPath, att.type);

                            if (textResult && textResult.error) {
                                console.error(`[Renderer - handleSendMessage] Error from getTextContent for ${att.name} (internal: ${internalPath}):`, textResult.error);
                                return { ...att, error: `Failed to extract text: ${textResult.error}` };
                            } else if (typeof textResult.textContent === 'string') {
                                return { ...att, extractedText: textResult.textContent };
                            } else {
                                console.warn(`[Renderer - handleSendMessage] getTextContent returned unexpected data for ${att.name} (internal: ${internalPath}):`, textResult);
                                return { ...att, error: "Failed to extract text: Unexpected return" };
                            }
                        } catch (error) {
                            console.error(`[Renderer - handleSendMessage] Exception during getTextContent for ${att.name} (internal: ${att.src}):`, error);
                            return { ...att, error: `Failed to extract text: ${error.message}` };
                        }
                    } else {
                        return { type: att.type, name: att.name, internalPath: att.src };
                    }
                }));
            }
            
            if (msg.role === 'user') {
                let userPrimaryText = msg.content || "";
                const mediaParts = [];
                const documentStrings = [];
                let documentIndex = 1;

                if (vcpAttachments.length > 0) {
                    vcpAttachments.forEach(att => {
                        if (att.error) {
                             console.warn(`[Renderer - handleSendMessage] Skipping attachment ${att.name} for VCP processing due to error: ${att.error}`);
                             return;
                        }

                        if (att.type.startsWith('image/') && att.data) {
                            const dataUrl = `data:${att.type};base64,${att.data}`;
                            mediaParts.push({ type: 'image_url', image_url: { url: dataUrl } });
                        } else if (att.type.startsWith('audio/') && att.data) {
                            const dataUrl = `data:${att.type};base64,${att.data}`;
                            mediaParts.push({ type: 'audio_url', audio_url: { url: dataUrl } });
                        } else if (att.extractedText !== undefined && att.extractedText !== null) {
                            documentStrings.push(`[文档${documentIndex}-${att.name}：${att.extractedText}]`);
                            documentIndex++;
                        }
                    });
                }
                
                let combinedTextContent = userPrimaryText;
                if (documentStrings.length > 0) {
                    if (combinedTextContent.length > 0) { 
                        combinedTextContent += "\n\n";
                    }
                    combinedTextContent += documentStrings.join("\n"); 
                }

                const finalContentForVCP = [{ type: 'text', text: combinedTextContent }];
                finalContentForVCP.push(...mediaParts);

                return { role: msg.role, content: finalContentForVCP };
            } else { 
                return {
                    role: msg.role,
                    content: msg.content
                };
            }
        }));


        if (agentConfig.systemPrompt) {
            const systemPromptContent = agentConfig.systemPrompt.replace(/\{\{AgentName\}\}/g, agentConfig.name || currentAgentId);
            messagesForVCP.unshift({ role: 'system', content: systemPromptContent });
        }
        
        const useStreaming = agentConfig.streamOutput === true || agentConfig.streamOutput === 'true';
        const modelConfigForVCP = {
            model: agentConfig.model,
            temperature: parseFloat(agentConfig.temperature),
            ...(agentConfig.maxOutputTokens && { max_tokens: parseInt(agentConfig.maxOutputTokens) }),
            stream: useStreaming
        };
        
        if (useStreaming) {
            activeStreamingMessageId = thinkingMessage.id; 
            if (window.messageRenderer) {
                window.messageRenderer.startStreamingMessage({ ...thinkingMessage, content: "" });
            }
        }

        const vcpResponse = await window.electronAPI.sendToVCP(
            globalSettings.vcpServerUrl,
            globalSettings.vcpApiKey,
            messagesForVCP,
            modelConfigForVCP,
            thinkingMessage.id 
        );

        if (!useStreaming) {
            const thinkingMsgDom = chatMessagesDiv.querySelector(`.message-item[data-message-id="${thinkingMessage.id}"]`);
            if (thinkingMsgDom) thinkingMsgDom.remove();
            const thinkingMsgIndexHist = currentChatHistory.findIndex(msg => msg.id === thinkingMessage.id);
            if (thinkingMsgIndexHist > -1) currentChatHistory.splice(thinkingMsgIndexHist, 1);

            if (vcpResponse.error) {
                if (window.messageRenderer) {
                    window.messageRenderer.renderMessage({ role: 'system', content: `VCP错误: ${vcpResponse.error}`, timestamp: Date.now() });
                }
            } else if (vcpResponse.choices && vcpResponse.choices.length > 0) {
                const assistantMessageContent = vcpResponse.choices[0].message.content;
                if (window.messageRenderer) {
                    window.messageRenderer.renderMessage({ role: 'assistant', content: assistantMessageContent, timestamp: Date.now() });
                }
            } else {
                if (window.messageRenderer) {
                    window.messageRenderer.renderMessage({ role: 'system', content: 'VCP返回了未知格式的响应。', timestamp: Date.now() });
                }
            }
            await window.electronAPI.saveChatHistory(currentAgentId, currentTopicId, currentChatHistory.filter(msg => !msg.isThinking));
            await attemptTopicSummarizationIfNeeded();
        } else { 
            if (vcpResponse && vcpResponse.streamError) {
                console.error("Streaming setup failed in main process:", vcpResponse.errorDetail || vcpResponse.error);
            } else if (vcpResponse && !vcpResponse.streamingStarted && !vcpResponse.streamError) {
                console.warn("Expected streaming to start, but main process returned non-streaming or error:", vcpResponse);
                activeStreamingMessageId = null;
                const thinkingMsgDom = chatMessagesDiv.querySelector(`.message-item[data-message-id="${thinkingMessage.id}"]`);
                if (thinkingMsgDom) thinkingMsgDom.remove();
                const thinkingMsgIndexHist = currentChatHistory.findIndex(msg => msg.id === thinkingMessage.id);
                if (thinkingMsgIndexHist > -1) currentChatHistory.splice(thinkingMsgIndexHist, 1);
                
                if (window.messageRenderer) {
                    window.messageRenderer.renderMessage({ role: 'system', content: '请求流式回复失败，收到非流式响应或错误。', timestamp: Date.now() });
                }
                await window.electronAPI.saveChatHistory(currentAgentId, currentTopicId, currentChatHistory.filter(msg => !msg.isThinking));
                await attemptTopicSummarizationIfNeeded();
            }
        }
 
    } catch (error) {
        console.error('发送消息或处理VCP响应时出错:', error);
        activeStreamingMessageId = null;
        const thinkingMsgDom = chatMessagesDiv.querySelector(`.message-item[data-message-id="${thinkingMessage.id}"]`);
        if (thinkingMsgDom) thinkingMsgDom.remove();
        const thinkingMsgIndexHist = currentChatHistory.findIndex(msg => msg.id === thinkingMessage.id);
        if (thinkingMsgIndexHist > -1) currentChatHistory.splice(thinkingMsgIndexHist, 1);

        if (window.messageRenderer) {
            window.messageRenderer.renderMessage({ role: 'system', content: `错误: ${error.message}`, timestamp: Date.now() });
        }
        if(currentAgentId && currentTopicId) {
            await window.electronAPI.saveChatHistory(currentAgentId, currentTopicId, currentChatHistory.filter(msg => !msg.isThinking));
        }
    }
}
 
function setupSidebarTabs() {
    sidebarTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            sidebarTabButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === targetTab);
            });

            sidebarTabContents.forEach(content => {
                const isActive = content.id === `tabContent${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`;
                content.classList.toggle('active', isActive);
                if (isActive) {
                    if (targetTab === 'topics') {
                        loadTopicList(); 
                    } else if (targetTab === 'settings') {
                        displayAgentSettingsInTab(); 
                    }
                }
            });
        });
    });
}

async function loadTopicList() {
    const topicsHeader = tabContentTopics.querySelector('.topics-header');
    const existingTopicListUl = tabContentTopics.querySelector('.topic-list');

    if (existingTopicListUl) {
        existingTopicListUl.remove();
    }
    
    if (!topicsHeader) {
        tabContentTopics.innerHTML = `
            <div class="topics-header">
                <h2>话题</h2>
                <div class="topic-search-container">
                    <input type="text" id="topicSearchInput" placeholder="搜索话题..." class="topic-search-input">
                    <button id="topicSearchBtn" class="topic-search-button">🔍</button>
                </div>
            </div>
            <ul class="topic-list" id="topicList"></ul>
        `;
    }

    const topicListUl = document.createElement('ul');
    topicListUl.classList.add('topic-list');
    topicListUl.id = 'topicList'; 
    tabContentTopics.appendChild(topicListUl); 
    
    let topicsToProcess = []; 

    if (currentAgentId) {
        const agentNameForLoading = document.querySelector(`.agent-list li[data-agent-id="${currentAgentId}"] .agent-name`)?.textContent || '当前助手';
        topicListUl.innerHTML = `<li><p>正在加载 ${agentNameForLoading} 的话题...</p></li>`;

        const agentConfig = await window.electronAPI.getAgentConfig(currentAgentId);
        if (!agentConfig || agentConfig.error) {
            topicListUl.innerHTML = `<li><p>无法加载助手 ${agentNameForLoading} 的配置信息: ${agentConfig?.error || '未知错误'}</p></li>`;
        } else {
            topicsToProcess = agentConfig.topics || [{ id: "default", name: "主要对话", createdAt: Date.now() }];

            topicsToProcess.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });

            if (topicsToProcess.length === 0) {
                topicListUl.innerHTML = `<li><p>助手 ${agentNameForLoading} 还没有任何话题。您可以点击上方的“新建上下文”按钮创建一个。</p></li>`;
            } else {
                topicListUl.innerHTML = ''; 
                for (const topic of topicsToProcess) {
                    const li = document.createElement('li');
                    li.classList.add('topic-item');
                    li.dataset.agentId = currentAgentId;
                    li.dataset.topicId = topic.id;
                    const isCurrentActiveTopic = topic.id === currentTopicId;
                    li.classList.toggle('active', isCurrentActiveTopic);
                    li.classList.toggle('active-topic-glowing', isCurrentActiveTopic);

                    const avatarImg = document.createElement('img');
                    avatarImg.classList.add('avatar');
                    const agentForAvatar = (await window.electronAPI.getAgents()).find(a => a.id === currentAgentId);
                    avatarImg.src = agentForAvatar?.avatarUrl ? `${agentForAvatar.avatarUrl}?t=${Date.now()}` : 'assets/default_avatar.png';
                    avatarImg.alt = `${agentConfig.name} - ${topic.name}`;
                    avatarImg.onerror = () => { avatarImg.src = 'assets/default_avatar.png'; };

                    const topicTitleDisplay = document.createElement('span');
                    topicTitleDisplay.classList.add('topic-title-display');
                    topicTitleDisplay.textContent = topic.name || `话题 ${topic.id}`;
                    
                    const messageCountSpan = document.createElement('span');
                    messageCountSpan.classList.add('message-count');
                    messageCountSpan.textContent = '...';

                    li.appendChild(avatarImg);
                    li.appendChild(topicTitleDisplay);
                    li.appendChild(messageCountSpan);

                    window.electronAPI.getChatHistory(currentAgentId, topic.id).then(historyResult => {
                        if (historyResult && !historyResult.error) {
                            messageCountSpan.textContent = `${historyResult.length}`;
                        } else {
                            messageCountSpan.textContent = 'N/A';
                            console.error(`Error fetching history for topic ${topic.id} to count messages:`, historyResult?.error);
                        }
                    }).catch(err => {
                         messageCountSpan.textContent = 'ERR';
                         console.error(`Exception fetching history for topic ${topic.id}:`, err);
                    });

                    li.addEventListener('click', async () => {
                        if (currentTopicId !== topic.id) {
                            currentTopicId = topic.id;
                            if (window.messageRenderer) {
                                window.messageRenderer.setCurrentTopicId(currentTopicId);
                            }
                            document.querySelectorAll('#topicList .topic-item').forEach(item => {
                                const isClickedItem = item.dataset.topicId === currentTopicId && item.dataset.agentId === currentAgentId;
                                item.classList.toggle('active', isClickedItem);
                                item.classList.toggle('active-topic-glowing', isClickedItem);
                            });
                            await loadChatHistory(currentAgentId, currentTopicId);
                            localStorage.setItem(`lastActiveTopic_${currentAgentId}`, currentTopicId);
                        }
                    });
                    
                    li.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        showTopicContextMenu(e, li, agentConfig, topic);
                    });
                    topicListUl.appendChild(li);
                }
            }
        }
    } else {
        topicListUl.innerHTML = '<li><p>请先在“助手”标签页选择一个Agent，以查看其相关话题。</p></li>';
    }

    if (currentAgentId && topicsToProcess && topicsToProcess.length > 0 && typeof Sortable !== 'undefined') {
        new Sortable(topicListUl, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: async function (evt) {
                const topicItems = Array.from(evt.to.children);
                const orderedTopicIds = topicItems.map(item => item.dataset.topicId);
                try {
                    const result = await window.electronAPI.saveTopicOrder(currentAgentId, orderedTopicIds);
                    if (result && result.success) {
                        await loadTopicList();
                    } else {
                        console.error(`[Sortable Topics DEBUG] Failed to save topic order for agent ${currentAgentId}:`, result?.error);
                        alert(`保存话题顺序失败: ${result?.error || '未知错误'}`);
                        loadTopicList();
                    }
                } catch (error) {
                    console.error(`[Sortable Topics DEBUG] Error calling saveTopicOrder for agent ${currentAgentId}:`, error);
                    alert(`调用保存话题顺序API时出错: ${error.message}`);
                    loadTopicList();
                }
            }
        });
    } else {
    }
}
 
function showTopicContextMenu(event, topicItemElement, agentConfig, topic) {
    closeContextMenu();
    closeTopicContextMenu();

    const menu = document.createElement('div');
    menu.id = 'topicContextMenu';
    menu.classList.add('context-menu');
    menu.style.top = `${event.clientY}px`;
    menu.style.left = `${event.clientX}px`;

    const editTitleOption = document.createElement('div');
    editTitleOption.classList.add('context-menu-item');
    editTitleOption.textContent = '编辑话题标题';
    editTitleOption.onclick = () => {
        closeTopicContextMenu();
        const titleDisplayElement = topicItemElement.querySelector('.topic-title-display');
        if (!titleDisplayElement) return;

        const originalTitle = topic.name;
        titleDisplayElement.style.display = 'none';

        const inputWrapper = document.createElement('div');
        inputWrapper.classList.add('topic-edit-input-wrapper', 'inline-edit-active');
        
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = originalTitle;
        titleInput.classList.add('topic-title-input');
        
        const saveButton = document.createElement('button');
        saveButton.textContent = '保存';
        saveButton.classList.add('topic-edit-save', 'inline-action-button');

        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.classList.add('topic-edit-cancel', 'inline-action-button');

        const restoreView = () => {
            inputWrapper.remove();
            titleDisplayElement.style.display = '';
        };

        saveButton.onclick = async () => {
            const newTitle = titleInput.value.trim();
            if (newTitle && newTitle !== originalTitle) {
                const result = await window.electronAPI.saveAgentTopicTitle(agentConfig.id || currentAgentId, topic.id, newTitle);
                if (result && result.success) {
                    titleDisplayElement.textContent = newTitle;
                    topic.name = newTitle; 
                } else {
                    alert(`更新话题标题失败: ${result ? result.error : '未知错误'}`);
                }
            }
            restoreView();
        };
        cancelButton.onclick = restoreView;
        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); saveButton.click(); }
            else if (e.key === 'Escape') { cancelButton.click(); }
        });
        inputWrapper.appendChild(titleInput);
        inputWrapper.appendChild(saveButton);
        inputWrapper.appendChild(cancelButton);
        topicItemElement.appendChild(inputWrapper); 
        titleInput.focus();
        titleInput.select();
    };
    menu.appendChild(editTitleOption);

    const clearTopicHistoryOption = document.createElement('div');
    clearTopicHistoryOption.classList.add('context-menu-item', 'danger-text');
    clearTopicHistoryOption.textContent = '清空此话题聊天记录';
    clearTopicHistoryOption.onclick = async () => {
        closeTopicContextMenu();
        if (confirm(`确定要清空话题 "${topic.name}" 的所有聊天记录吗？此操作不可撤销。`)) {
            await window.electronAPI.saveChatHistory(currentAgentId, topic.id, []); 
            if (currentTopicId === topic.id) { 
                currentChatHistory = [];
                chatMessagesDiv.innerHTML = '';
                if (window.messageRenderer) {
                    window.messageRenderer.initializeMessageRenderer({ currentChatHistory, currentAgentId, currentTopicId, globalSettings, chatMessagesDiv, electronAPI, markedInstance, scrollToBottom, summarizeTopicFromMessages, openModal, autoResizeTextarea, handleCreateBranch });
                    window.messageRenderer.renderMessage({ role: 'system', content: `话题 "${topic.name}" 的聊天记录已清空。`, timestamp: Date.now() });
                }
                await displayTopicTimestampBubble(currentAgentId, topic.id);
            }
            alert(`话题 "${topic.name}" 的聊天记录已清空。`);
            loadTopicList(); 
        }
    };
    menu.appendChild(clearTopicHistoryOption);

    const deleteTopicPermanentlyOption = document.createElement('div');
    deleteTopicPermanentlyOption.classList.add('context-menu-item', 'danger-text'); 
    deleteTopicPermanentlyOption.textContent = '永久删除此话题';
    deleteTopicPermanentlyOption.onclick = async () => {
        closeTopicContextMenu();
        if (confirm(`您确定要永久删除话题 "${topic.name}" 吗？\n此操作将删除话题本身及其所有聊天记录，且不可撤销！`)) {
            const result = await window.electronAPI.deleteTopic(currentAgentId, topic.id);
            if (result && result.success) {
                loadTopicList(); 

                if (currentTopicId === topic.id) {
                    const updatedTopics = result.remainingTopics || await window.electronAPI.getAgentTopics(currentAgentId);
                    if (updatedTopics && updatedTopics.length > 0) {
                        currentTopicId = updatedTopics[0].id;
                        await loadChatHistory(currentAgentId, currentTopicId);
                    } else { 
                        currentTopicId = null;
                        chatMessagesDiv.innerHTML = '<div class="message-item system"><div class="sender-name">系统</div><div>所有话题均已删除。</div></div>';
                        await displayTopicTimestampBubble(currentAgentId, null); 
                    }
                }
            } else {
                alert(`删除话题 "${topic.name}" 失败: ${result ? result.error : '未知错误'}`);
            }
        }
    };
    menu.appendChild(deleteTopicPermanentlyOption);
    

    document.body.appendChild(menu);
    document.addEventListener('click', closeTopicContextMenuOnClickOutside, true);
}

function closeTopicContextMenu() {
    const existingMenu = document.getElementById('topicContextMenu');
    if (existingMenu) {
        existingMenu.remove();
        document.removeEventListener('click', closeTopicContextMenuOnClickOutside, true);
    }
}

function closeTopicContextMenuOnClickOutside(event) {
    const menu = document.getElementById('topicContextMenu');
    if (menu && !menu.contains(event.target)) {
        closeTopicContextMenu();
    }
}


// --- UI Event Listeners & Helpers ---
function setupEventListeners() {
    if (chatMessagesDiv) {
        chatMessagesDiv.addEventListener('click', (event) => {
            const target = event.target.closest('a'); 

            if (target && target.href) {
                const href = target.href;
                event.preventDefault();

                if (href.startsWith('#')) {
                    console.log('Internal anchor link clicked, allowing default behavior or custom handling if needed.');
                    return; 
                }
                
                if (href.toLowerCase().startsWith('javascript:')) {
                    console.log('JavaScript link clicked, ignoring for external open.');
                    return;
                }
                
                if (href.startsWith('http:') || href.startsWith('https:') || href.startsWith('file:')) {
                    if (window.electronAPI && window.electronAPI.sendOpenExternalLink) {
                        window.electronAPI.sendOpenExternalLink(href);
                    } else {
                        console.warn('[Renderer] electronAPI.sendOpenExternalLink is not available. Cannot open link externally.');
                    }
                } else {
                    console.warn(`[Renderer] Clicked link with unhandled protocol, not opening externally: ${href}`);
                }
            }
        });
    } else {
        console.error('[Renderer] chatMessagesDiv not found during setupEventListeners.');
    }

    sendMessageBtn.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    messageInput.addEventListener('input', () => autoResizeTextarea(messageInput));

    attachFileBtn.addEventListener('click', async () => {
        if (!currentAgentId || !currentTopicId) {
            alert("请先选择一个Agent和话题以上传附件。");
            return;
        }
        const result = await window.electronAPI.selectFilesToSend(currentAgentId, currentTopicId);

        if (result && result.success && result.attachments && result.attachments.length > 0) {
            result.attachments.forEach(att => {
                if (att.error) {
                    console.error(`Error processing selected file ${att.name || 'unknown'}: ${att.error}`);
                    alert(`处理文件 ${att.name || '未知文件'} 失败: ${att.error}`);
                } else {
                    // THIS IS THE KEY PART:
                    attachedFiles.push({
                        file: { name: att.name, type: att.type, size: att.size }, // Basic file info
                        localPath: att.internalPath,    // For sending to VCP if needed as path later
                        originalName: att.name,         // For display
                        _fileManagerData: att           // Store the WHOLE object from main process
                    });
                }
            });
            updateAttachmentPreview();
        } else if (result && !result.success && result.attachments && result.attachments.length === 0) {
            console.log('[Renderer] File selection cancelled or no files selected.');
        } else if (result && result.error) {
            alert(`选择文件时出错: ${result.error}`);
        }
    });
    
 
    globalSettingsBtn.addEventListener('click', () => openModal('globalSettingsModal'));
    globalSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newSettings = {
            userName: document.getElementById('userName').value.trim(), 
            vcpServerUrl: document.getElementById('vcpServerUrl').value.trim(),
            vcpApiKey: document.getElementById('vcpApiKey').value, 
            vcpLogUrl: document.getElementById('vcpLogUrl').value.trim(),
            vcpLogKey: document.getElementById('vcpLogKey').value.trim(),
            sidebarWidth: globalSettings.sidebarWidth,
            notificationsSidebarWidth: globalSettings.notificationsSidebarWidth
        };

        if (croppedUserAvatarFile) { // Check if a new user avatar was cropped
            try {
                const arrayBuffer = await croppedUserAvatarFile.arrayBuffer();
                const avatarSaveResult = await window.electronAPI.saveUserAvatar({
                    name: croppedUserAvatarFile.name, // "avatar.png"
                    type: croppedUserAvatarFile.type, // "image/png"
                    buffer: arrayBuffer
                });
                if (avatarSaveResult.success) {
                    globalSettings.userAvatarUrl = avatarSaveResult.avatarUrl; // Update globalSettings for immediate use
                    userAvatarPreview.src = avatarSaveResult.avatarUrl;
                    userAvatarPreview.style.display = 'block';
                    if (window.messageRenderer) {
                        window.messageRenderer.setUserAvatar(avatarSaveResult.avatarUrl);
                    }
                    // Trigger color extraction and saving for the new user avatar
                    if (avatarSaveResult.needsColorExtraction && window.electronAPI && window.electronAPI.saveAvatarColor) { // Use window.electronAPI directly
                        getAverageColorFromAvatar(avatarSaveResult.avatarUrl, (avgColor) => {
                            if (avgColor) {
                                window.electronAPI.saveAvatarColor({ type: 'user', id: 'user_global', color: avgColor }) // Use window.electronAPI directly
                                    .then((saveColorResult) => {
                                        if (saveColorResult && saveColorResult.success) {
                                            if (window.messageRenderer) window.messageRenderer.setUserAvatarColor(avgColor);
                                        } else {
                                            console.warn("Failed to save user avatar color via IPC:", saveColorResult?.error);
                                        }
                                    }).catch(err => console.error("Error saving user avatar color:", err));
                            }
                        });
                    }

                    croppedUserAvatarFile = null; // Clear after save
                    userAvatarInput.value = '';
                } else {
                    alert(`保存用户头像失败: ${avatarSaveResult.error}`);
                }
            } catch (readError) {
                alert(`读取用户头像文件失败: ${readError.message}`);
            }
        }

        const result = await window.electronAPI.saveSettings(newSettings); // Save other settings
        if (result.success) {
            // newSettings now only contains non-avatar settings, merge with existing avatar if not changed
            globalSettings = {...globalSettings, ...newSettings }; 
            alert('全局设置已保存！部分设置（如通知URL/Key）可能需要重新连接生效。');
            closeModal('globalSettingsModal');
            if (globalSettings.vcpLogUrl && globalSettings.vcpLogKey) {
                 window.electronAPI.connectVCPLog(globalSettings.vcpLogUrl, globalSettings.vcpLogKey);
            } else {
                 window.electronAPI.disconnectVCPLog();
                 if (window.notificationRenderer) window.notificationRenderer.updateVCPLogStatus({ status: 'error', message: 'VCPLog未配置' }, vcpLogConnectionStatusDiv);
            }
       } else {
           alert(`保存全局设置失败: ${result.error}`);
        }
    });

    // Event listener for User Avatar Input in Global Settings
    if (userAvatarInput) {
        userAvatarInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                openAvatarCropper(file, (croppedFile) => { // Pass a callback to handle cropped file
                    croppedUserAvatarFile = croppedFile; // Store it for saving with global settings
                    if (userAvatarPreview) {
                        userAvatarPreview.src = URL.createObjectURL(croppedUserAvatarFile);
                        userAvatarPreview.style.display = 'block';
                    }
                });
            } else {
                if (userAvatarPreview) userAvatarPreview.style.display = 'none';
                croppedUserAvatarFile = null;
            }
        });
    }


    createNewAgentBtn.addEventListener('click', async () => {
        const defaultAgentName = `新Agent_${Date.now()}`;
        
        if (defaultAgentName) {
            const result = await window.electronAPI.createAgent(defaultAgentName);
            if (result.success) {
                await loadAgentList();
                selectAgent(result.agentId, result.agentName);
                openAgentSettingsModal(result.agentId);
            } else {
                alert(`创建Agent失败: ${result.error}`);
            }
        }
    });
    
    currentAgentSettingsBtn.addEventListener('click', async () => {
        if (currentAgentId) {
            await createNewContextFromCurrentAgent();
        } else {
            alert("请先选择一个Agent作为上下文的基础。");
        }
    });

    agentSettingsForm.addEventListener('submit', saveCurrentAgentSettings);
    deleteAgentBtn.addEventListener('click', deleteCurrentAgent);

    agentAvatarInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            openAvatarCropper(file, (croppedFileResult) => { // Callback for agent avatar
                croppedAvatarFile = croppedFileResult; // Store for agent settings save
                if (agentAvatarPreview) {
                    agentAvatarPreview.src = URL.createObjectURL(croppedAvatarFile);
                    agentAvatarPreview.style.display = 'block';
                }
            });
        } else {
            agentAvatarPreview.style.display = 'none';
            croppedAvatarFile = null; 
        }
    });

    clearCurrentChatBtn.addEventListener('click', async () => {
        if (currentAgentId && currentTopicId && confirm(`确定要清空当前话题的聊天记录吗（助手: ${currentChatAgentNameH3.textContent.replace('与 ','').replace(' 聊天中','')}）？此操作不可撤销。`)) {
            currentChatHistory = [];
            await window.electronAPI.saveChatHistory(currentAgentId, currentTopicId, []); 
            chatMessagesDiv.innerHTML = '';
            if (window.messageRenderer) {
                 window.messageRenderer.initializeMessageRenderer({ currentChatHistory, currentAgentId, currentTopicId, globalSettings, chatMessagesDiv, electronAPI, markedInstance, scrollToBottom, summarizeTopicFromMessages, openModal, autoResizeTextarea, handleCreateBranch });
                 window.messageRenderer.renderMessage({ role: 'system', content: '当前话题聊天记录已清空。', timestamp: Date.now() });
            }
            
            const clearedTopicName = `话题 ${currentTopicId.substring(0,8)}...`; 
            const titleSaveResult = await window.electronAPI.saveAgentTopicTitle(currentAgentId, currentTopicId, clearedTopicName);
            if (titleSaveResult.success) {
                if (document.getElementById('tabContentTopics').classList.contains('active')) {
                    loadTopicList();
                }
            }
            alert('当前话题聊天记录已清空，话题标题已重置。');
        } else if (!currentTopicId) {
            alert("没有选中的话题可清空。");
        }
    });

    clearNotificationsBtn.addEventListener('click', () => {
        notificationsListUl.innerHTML = '';
    });

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const sunIcon = document.getElementById('sun-icon');
            const moonIcon = document.getElementById('moon-icon');

            document.body.classList.toggle('light-theme');
            if (document.body.classList.contains('light-theme')) {
                localStorage.setItem('theme', 'light');
                if (sunIcon) sunIcon.style.display = 'none';
                if (moonIcon) moonIcon.style.display = 'inline-block'; 
            } else {
                localStorage.setItem('theme', 'dark');
                if (sunIcon) sunIcon.style.display = 'inline-block'; 
                if (moonIcon) moonIcon.style.display = 'none';
            }
        });
    }

    const openNotesBtn = document.getElementById('openNotesBtn');

    if (openAdminPanelBtn) {
        openAdminPanelBtn.style.display = 'inline-block';
        openAdminPanelBtn.addEventListener('click', async () => {
            if (globalSettings.vcpServerUrl) {
                if (window.electronAPI && window.electronAPI.sendOpenExternalLink) {
                    try {
                        const apiUrl = new URL(globalSettings.vcpServerUrl);
                        let adminPanelUrl = `${apiUrl.protocol}//${apiUrl.host}`;
                        if (!adminPanelUrl.endsWith('/')) {
                            adminPanelUrl += '/';
                        }
                        adminPanelUrl += 'AdminPanel/'; 

                        window.electronAPI.sendOpenExternalLink(adminPanelUrl);
                    } catch (e) {
                        console.error('构建管理面板URL失败:', e);
                        alert('无法构建有效的管理面板URL。请检查全局设置中的VCP服务器URL。');
                    }
                } else {
                    console.warn('[Renderer] electronAPI.sendOpenExternalLink is not available.');
                    alert('无法打开管理面板：所需功能不可用。');
                }
            } else {
                alert('请先在全局设置中配置VCP服务器URL！');
                openModal('globalSettingsModal');
            }
        });
    }

    if (openNotesBtn) {
        openNotesBtn.addEventListener('click', async () => {
            const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
            if (window.electronAPI && window.electronAPI.openNotesWindow) {
                await window.electronAPI.openNotesWindow(currentTheme);
            } else {
                console.warn('[Renderer] electronAPI.openNotesWindow is not available.');
                alert('无法打开笔记：所需功能不可用。');
            }
        });
    }

    if (toggleNotificationsBtn && notificationsSidebar) {
        toggleNotificationsBtn.addEventListener('click', () => {
            window.electronAPI.sendToggleNotificationsSidebar();
        });

        window.electronAPI.onDoToggleNotificationsSidebar(() => {
            const isActive = notificationsSidebar.classList.toggle('active'); 
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.classList.toggle('notifications-sidebar-active', isActive);
            }
            // If activating and a saved width exists, apply it
            if (isActive && globalSettings.notificationsSidebarWidth) {
                 notificationsSidebar.style.width = `${globalSettings.notificationsSidebarWidth}px`;
            } else if (!isActive) {
                // Optional: if you want to reset to a "hidden" width or remove inline style
                // notificationsSidebar.style.width = ''; // Or '0px' depending on CSS
            }
        });
    }
}

 
// --- Resizer Functionality ---
function initializeResizers() {
    let isResizingLeft = false;
    let isResizingRight = false;
    let startX = 0;
    // We don't need initial widths here anymore as we'll read offsetWidth directly

    if (resizerLeft && leftSidebar) {
        resizerLeft.addEventListener('mousedown', (e) => {
            isResizingLeft = true;
            startX = e.clientX;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            leftSidebar.style.transition = 'none'; // Disable transition during drag
        });
    }

    if (resizerRight && rightNotificationsSidebar) {
        resizerRight.addEventListener('mousedown', (e) => {
            // If notifications sidebar is not active, activate it first
            if (!rightNotificationsSidebar.classList.contains('active')) {
                window.electronAPI.sendToggleNotificationsSidebar(); // This will trigger onDoToggle... which applies saved width
                 // Wait a tick for the sidebar to potentially become active and apply its width
                requestAnimationFrame(() => {
                    isResizingRight = true;
                    startX = e.clientX;
                    document.body.style.cursor = 'col-resize';
                    document.body.style.userSelect = 'none';
                    rightNotificationsSidebar.style.transition = 'none';
                });
            } else {
                isResizingRight = true;
                startX = e.clientX;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
                rightNotificationsSidebar.style.transition = 'none';
            }
        });
    }

    document.addEventListener('mousemove', (e) => {
        if (isResizingLeft && leftSidebar) {
            const deltaX = e.clientX - startX;
            const currentWidth = leftSidebar.offsetWidth;
            let newWidth = currentWidth + deltaX;
            newWidth = Math.max(parseInt(getComputedStyle(leftSidebar).minWidth, 10) || 180, Math.min(newWidth, parseInt(getComputedStyle(leftSidebar).maxWidth, 10) || 600)); 
            leftSidebar.style.width = `${newWidth}px`;
            startX = e.clientX; // Update startX for continuous dragging
        }
        if (isResizingRight && rightNotificationsSidebar && rightNotificationsSidebar.classList.contains('active')) {
            const deltaX = e.clientX - startX;
            const currentWidth = rightNotificationsSidebar.offsetWidth;
            let newWidth = currentWidth - deltaX; // Dragging right decreases width
            newWidth = Math.max(parseInt(getComputedStyle(rightNotificationsSidebar).minWidth, 10) || 220, Math.min(newWidth, parseInt(getComputedStyle(rightNotificationsSidebar).maxWidth, 10) || 600));
            rightNotificationsSidebar.style.width = `${newWidth}px`;
            startX = e.clientX; // Update startX
        }
    });

    document.addEventListener('mouseup', async () => {
        if (isResizingLeft || isResizingRight) {
            let settingsChanged = false;
            if (isResizingLeft && leftSidebar) {
                leftSidebar.style.transition = ''; 
                const newSidebarWidth = leftSidebar.offsetWidth;
                if (globalSettings.sidebarWidth !== newSidebarWidth) {
                    globalSettings.sidebarWidth = newSidebarWidth;
                    settingsChanged = true;
                }
            }
            if (isResizingRight && rightNotificationsSidebar && rightNotificationsSidebar.classList.contains('active')) {
                rightNotificationsSidebar.style.transition = '';
                const newNotificationsWidth = rightNotificationsSidebar.offsetWidth;
                 if (globalSettings.notificationsSidebarWidth !== newNotificationsWidth) {
                    globalSettings.notificationsSidebarWidth = newNotificationsWidth;
                    settingsChanged = true;
                }
            }

            isResizingLeft = false;
            isResizingRight = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            if (settingsChanged) {
                try {
                    await window.electronAPI.saveSettings(globalSettings);
                    console.log('Sidebar widths saved to settings.');
                } catch (error) {
                    console.error('Failed to save sidebar widths:', error);
                }
            }
        }
    });
}


function updateAttachmentPreview() {
    if (!attachmentPreviewArea) {
        console.error('[Renderer] updateAttachmentPreview: attachmentPreviewArea is null or undefined!');
        return;
    }

    attachmentPreviewArea.innerHTML = '';
    if (attachedFiles.length === 0) {
        attachmentPreviewArea.style.display = 'none';
        return;
    }
    attachmentPreviewArea.style.display = 'flex';

    attachedFiles.forEach((af, index) => {
        const prevDiv = document.createElement('div');
        prevDiv.className = 'attachment-preview-item';
        const displayName = af.originalName || (af.file ? af.file.name : '未知文件');
        prevDiv.title = displayName;

        let iconOrThumbElement; // Renamed for clarity
        const fileManagerData = af._fileManagerData;

        if (fileManagerData && fileManagerData.type && fileManagerData.type.startsWith('image/') && fileManagerData.internalPath) {
            iconOrThumbElement = document.createElement('img');
            iconOrThumbElement.className = 'file-preview-thumbnail';
            iconOrThumbElement.src = fileManagerData.internalPath;
            iconOrThumbElement.alt = displayName;
            iconOrThumbElement.onerror = () => {
                const fallbackIcon = document.createElement('span');
                fallbackIcon.className = 'file-preview-icon';
                fallbackIcon.textContent = '⚠️';
                if (prevDiv.contains(iconOrThumbElement)) { // Ensure it's still there before replacing
                    prevDiv.replaceChild(fallbackIcon, iconOrThumbElement);
                }
            };
        } else {
            iconOrThumbElement = document.createElement('span');
            iconOrThumbElement.className = 'file-preview-icon';
            const fileType = fileManagerData ? fileManagerData.type : (af.file ? af.file.type : '');
            if (fileType.startsWith('image/')) iconOrThumbElement.textContent = '🖼️';
            else if (fileType.startsWith('audio/')) iconOrThumbElement.textContent = '🎵';
            else if (fileType.startsWith('video/')) iconOrThumbElement.textContent = '🎞️';
            else if (fileType.includes('pdf')) iconOrThumbElement.textContent = '📄';
            else if (fileManagerData && fileManagerData.type === 'error/file-processing') iconOrThumbElement.textContent = '⚠️';
            else iconOrThumbElement.textContent = '📎';
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'file-preview-name';
        nameSpan.textContent = displayName.length > 15 ? displayName.substring(0, 12) + '...' : displayName;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'file-preview-remove-btn-inline'; // New class for inline button
        removeBtn.innerHTML = '×';
        removeBtn.title = '移除此附件';
        removeBtn.onclick = () => {
            attachedFiles.splice(index, 1);
            updateAttachmentPreview();
        };

        // Append in desired order: icon/thumb, then name, then remove button
        prevDiv.appendChild(iconOrThumbElement);
        prevDiv.appendChild(nameSpan);
        prevDiv.appendChild(removeBtn); // Now appended as a direct child in flow

        attachmentPreviewArea.appendChild(prevDiv);
    });
}


function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto'; 
    textarea.style.height = textarea.scrollHeight + 'px';
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}
 
async function openAvatarCropper(file, onCropConfirmedCallback) { // Added callback
    const modal = document.getElementById('avatarCropperModal');
    const cropperContainer = document.getElementById('avatarCropperContainer');
    const canvas = document.getElementById('avatarCanvas');
    const ctx = canvas.getContext('2d');
    const cropCircleSVG = document.getElementById('cropCircle');
    const cropCircleBorderSVG = document.getElementById('cropCircleBorder');
    const confirmCropBtn = document.getElementById('confirmCropBtn');
    const cancelCropBtn = document.getElementById('cancelCropBtn');

    openModal('avatarCropperModal');
    // Ensure canvas is clean and visible
    canvas.style.display = 'block';
    cropperContainer.style.cursor = 'grab'; // Initial cursor

    let img = new Image();
    img.onload = () => {
        // Step 1: Automatic 360x360 processing
        canvas.width = 360; // Ensure canvas dimensions are set
        canvas.height = 360;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        console.log("[AvatarCropper] Image loaded:", img.width, "x", img.height);
        console.log("[AvatarCropper] Canvas size:", canvas.width, "x", canvas.height);

        let newWidth, newHeight, offsetX, offsetY;
        if (img.width > img.height) {
            newWidth = canvas.width;
            newHeight = (img.height / img.width) * canvas.width;
        } else {
            newHeight = canvas.height;
            newWidth = (img.width / img.height) * canvas.height;
        }
        offsetX = (canvas.width - newWidth) / 2;
        offsetY = (canvas.height - newHeight) / 2;
        ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
        console.log("[AvatarCropper] Image drawn on canvas at", offsetX, offsetY, "with size", newWidth, newHeight);

        // Initialize cropper state (circle)
        let circle = { x: 180, y: 180, r: Math.min(180, Math.min(newWidth, newHeight) / 2, 150) }; // Initial radius
        updateCircleSVG();

        let isDragging = false;
        let dragStartX, dragStartY, circleStartX, circleStartY;

        function updateCircleSVG() {
            cropCircleSVG.setAttribute('cx', circle.x);
            cropCircleSVG.setAttribute('cy', circle.y);
            cropCircleSVG.setAttribute('r', circle.r);
            cropCircleBorderSVG.setAttribute('cx', circle.x);
            cropCircleBorderSVG.setAttribute('cy', circle.y);
            cropCircleBorderSVG.setAttribute('r', circle.r);
        }

        const onMouseDown = (e) => {
            const rect = cropperContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            // Check if click is within the circle (optional, could allow dragging from anywhere)
            // if (Math.sqrt((mouseX - circle.x)**2 + (mouseY - circle.y)**2) < circle.r) {
                isDragging = true;
                dragStartX = mouseX;
                dragStartY = mouseY;
                circleStartX = circle.x;
                circleStartY = circle.y;
                cropperContainer.style.cursor = 'grabbing';
            // }
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            const rect = cropperContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            circle.x = circleStartX + (mouseX - dragStartX);
            circle.y = circleStartY + (mouseY - dragStartY);
            // Clamp circle to stay within canvas
            circle.x = Math.max(circle.r, Math.min(canvas.width - circle.r, circle.x));
            circle.y = Math.max(circle.r, Math.min(canvas.height - circle.r, circle.y));
            updateCircleSVG();
        };

        const onMouseUpOrLeave = () => {
            isDragging = false;
            cropperContainer.style.cursor = 'grab';
        };

        const onWheel = (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            const newRadius = Math.max(30, Math.min(180, circle.r * zoomFactor)); // Min/max radius
            if (newRadius === circle.r) return; // No change
            circle.r = newRadius;
            // Recalculate clamping after zoom
            circle.x = Math.max(circle.r, Math.min(canvas.width - circle.r, circle.x));
            circle.y = Math.max(circle.r, Math.min(canvas.height - circle.r, circle.y));
            updateCircleSVG();
        };

        const onConfirmCrop = () => {
            console.log("[AvatarCropper] Confirm crop clicked. Circle:", circle);
            const finalCanvas = document.createElement('canvas');
            const finalSize = circle.r * 2;
            finalCanvas.width = finalSize;
            finalCanvas.height = finalSize;
            const finalCtx = finalCanvas.getContext('2d');

            finalCtx.drawImage(canvas, // source canvas (original 360x360)
                circle.x - circle.r, circle.y - circle.r, // source x, y (top-left of crop rect)
                finalSize, finalSize, // source width, height
                0, 0, // destination x, y
                finalSize, finalSize // destination width, height
            );

            // Make it circular with transparency
            finalCtx.globalCompositeOperation = 'destination-in';
            finalCtx.beginPath();
            finalCtx.arc(circle.r, circle.r, circle.r, 0, Math.PI * 2);
            finalCtx.fill();
            finalCtx.globalCompositeOperation = 'source-over'; // Reset

            finalCanvas.toBlob((blob) => {
                if (!blob) {
                    console.error("[AvatarCropper] Failed to create blob from final canvas.");
                    alert("裁剪失败，无法生成图片数据。");
                    return;
                }
                console.log("[AvatarCropper] Cropped blob created, size:", blob.size);
                const croppedFile = new File([blob], "avatar.png", { type: "image/png" });
                
                if (typeof onCropConfirmedCallback === 'function') {
                    onCropConfirmedCallback(croppedFile); // Pass the file to the callback
                }
                cleanupCropperEvents();
                closeModal('avatarCropperModal');
            }, 'image/png');
        };

        const onCancelCrop = () => {
            console.log("[AvatarCropper] Cancel crop clicked.");
            cleanupCropperEvents();
            closeModal('avatarCropperModal');
            document.getElementById('agentAvatarInput').value = ''; // Clear file input if it's for agent
            if (userAvatarInput) userAvatarInput.value = ''; // Clear user avatar input too
        };

        // Add event listeners
        cropperContainer.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove); // Listen on document for dragging outside
        document.addEventListener('mouseup', onMouseUpOrLeave); // Listen on document
        cropperContainer.addEventListener('mouseleave', onMouseUpOrLeave);
        cropperContainer.addEventListener('wheel', onWheel);
        confirmCropBtn.addEventListener('click', onConfirmCrop);
        cancelCropBtn.addEventListener('click', onCancelCrop);

        // Function to remove event listeners
        function cleanupCropperEvents() {
            cropperContainer.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUpOrLeave);
            cropperContainer.removeEventListener('mouseleave', onMouseUpOrLeave);
            cropperContainer.removeEventListener('wheel', onWheel);
            confirmCropBtn.removeEventListener('click', onConfirmCrop);
            cancelCropBtn.removeEventListener('click', onCancelCrop);
        }
    };
    img.onerror = () => {
        console.error("[AvatarCropper] Image failed to load from blob URL.");
        alert("无法加载选择的图片，请尝试其他图片。");
        closeModal('avatarCropperModal');
    }
    img.src = URL.createObjectURL(file);
}

async function displayAgentSettingsInTab() {
    if (currentAgentId) {
        agentSettingsContainer.style.display = 'block';
        selectAgentPromptForSettings.style.display = 'none';

        const config = await window.electronAPI.getAgentConfig(currentAgentId);
        if (config.error) {
            alert(`加载Agent配置失败: ${config.error}`);
            agentSettingsContainer.style.display = 'none';
            selectAgentPromptForSettings.textContent = `加载 ${currentChatAgentNameH3.textContent.replace('与 ','').replace(' 聊天中','')} 配置失败。`;
            selectAgentPromptForSettings.style.display = 'block';
            return;
        }
        const agents = await window.electronAPI.getAgents();
        const agent = agents.find(a => a.id === currentAgentId);

        if (!agent) {
            agentSettingsContainer.style.display = 'none';
            selectAgentPromptForSettings.textContent = `未找到ID为 ${currentAgentId} 的Agent。`;
            selectAgentPromptForSettings.style.display = 'block';
            return;
        }
        
        if(selectedAgentNameForSettingsSpan) selectedAgentNameForSettingsSpan.textContent = agent.name || currentAgentId;
        
        editingAgentIdInput.value = currentAgentId;
        agentNameInput.value = agent.name || currentAgentId;
        agentSystemPromptTextarea.value = config.systemPrompt || '';
        agentModelInput.value = config.model || '';
        agentTemperatureInput.value = config.temperature !== undefined ? config.temperature : 0.7;
        agentContextTokenLimitInput.value = config.contextTokenLimit !== undefined ? config.contextTokenLimit : 4000;
        agentMaxOutputTokensInput.value = config.maxOutputTokens !== undefined ? config.maxOutputTokens : 1000;

        const streamOutput = config.streamOutput !== undefined ? config.streamOutput : true; 
        document.getElementById('agentStreamOutputTrue').checked = streamOutput === true || streamOutput === 'true';
        document.getElementById('agentStreamOutputFalse').checked = streamOutput === false || streamOutput === 'false';
        
        if (agent.avatarUrl) {
            agentAvatarPreview.src = agent.avatarUrl + `?t=${Date.now()}`; 
            agentAvatarPreview.style.display = 'block';
        } else {
            agentAvatarPreview.src = '#';
            agentAvatarPreview.style.display = 'none';
        }
        agentAvatarInput.value = ''; 
    } else {
        agentSettingsContainer.style.display = 'none';
        selectAgentPromptForSettings.textContent = '请先在“助手”标签页选择一个Agent以查看或修改其设置。';
        selectAgentPromptForSettings.style.display = 'block';
        if(selectedAgentNameForSettingsSpan) selectedAgentNameForSettingsSpan.textContent = ''; 
    }
}
 
async function saveCurrentAgentSettings(event) {
    event.preventDefault();
    const agentId = editingAgentIdInput.value;
    const newConfig = {
        name: agentNameInput.value.trim(),
        systemPrompt: agentSystemPromptTextarea.value.trim(),
        model: agentModelInput.value.trim() || 'gemini-pro', // Default if empty
        temperature: parseFloat(agentTemperatureInput.value),
        contextTokenLimit: parseInt(agentContextTokenLimitInput.value),
        maxOutputTokens: parseInt(agentMaxOutputTokensInput.value),
        streamOutput: document.getElementById('agentStreamOutputTrue').checked 
    };
 
    if (!newConfig.name) {
        alert("Agent名称不能为空！");
        return;
    }
 
    // Use croppedAvatarFile if it exists (set by the cropper)
    if (croppedAvatarFile) {
        try {
            const arrayBuffer = await croppedAvatarFile.arrayBuffer();
            const avatarResult = await window.electronAPI.saveAvatar(agentId, {
                name: croppedAvatarFile.name, // Should be "avatar.png"
                type: croppedAvatarFile.type, // Should be "image/png"
                buffer: arrayBuffer
            });
 
            if (avatarResult.error) {
                alert(`保存头像失败: ${avatarResult.error}`);
            } else {
                // Trigger color extraction and saving for the new agent avatar
                if (avatarResult.needsColorExtraction && window.electronAPI && window.electronAPI.saveAvatarColor) { // Use window.electronAPI directly
                     getAverageColorFromAvatar(avatarResult.avatarUrl, (avgColor) => {
                        if (avgColor) {
                            window.electronAPI.saveAvatarColor({ type: 'agent', id: agentId, color: avgColor }) // Use window.electronAPI directly
                                .then((saveColorResult) => {
                                    if (saveColorResult && saveColorResult.success) {
                                        if(currentAgentId === agentId && window.messageRenderer) window.messageRenderer.setCurrentAgentAvatarColor(avgColor);
                                    } else {
                                        console.warn(`Failed to save agent ${agentId} avatar color via IPC:`, saveColorResult?.error);
                                    }
                                }).catch(err => console.error(`Error saving agent ${agentId} avatar color:`, err));
                        }
                    });
                }
                // Update preview immediately with the version from backend (with timestamp)
                agentAvatarPreview.src = avatarResult.avatarUrl;
                croppedAvatarFile = null; // Clear after successful save
                agentAvatarInput.value = ''; // Clear the file input field
            }
        } catch (readError) {
            console.error("读取头像文件失败:", readError);
            alert(`读取头像文件失败: ${readError.message}`);
        }
    }
 
    const result = await window.electronAPI.saveAgentConfig(agentId, newConfig);
    const saveButton = agentSettingsForm.querySelector('button[type="submit"]'); 
 
    if (result.success) {
        if (saveButton) {
            const originalButtonText = saveButton.textContent;
            saveButton.textContent = '已保存!';
            saveButton.disabled = true; 
            setTimeout(() => {
                saveButton.textContent = originalButtonText;
                saveButton.disabled = false; 
            }, 2000); 
        }
        await loadAgentList(); 
        if (currentAgentId === agentId) {
            currentChatAgentNameH3.textContent = `与 ${newConfig.name} 聊天中`;
            // Update agent avatar in message renderer if current agent's avatar changed
            const updatedAgent = (await window.electronAPI.getAgents()).find(a => a.id === currentAgentId);
            if (updatedAgent && window.messageRenderer) {
                window.messageRenderer.setCurrentAgentAvatar(updatedAgent.avatarUrl);
                // Ensure config object exists before accessing avatarCalculatedColor
                const newAgentColor = updatedAgent.config ? updatedAgent.config.avatarCalculatedColor : null;
                window.messageRenderer.setCurrentAgentAvatarColor(newAgentColor || null);
 
            }
 
            if(selectedAgentNameForSettingsSpan) selectedAgentNameForSettingsSpan.textContent = newConfig.name;
        }
    } else {
        if (saveButton) { 
            const originalButtonText = saveButton.textContent;
            saveButton.textContent = '保存失败';
            saveButton.classList.add('error-feedback'); 
            saveButton.disabled = true;
            setTimeout(() => {
                saveButton.textContent = originalButtonText; // Restore original text
                saveButton.classList.remove('error-feedback');
                saveButton.disabled = false;
            }, 3000); 
        }
    }
}

async function deleteCurrentAgent() {
    const agentId = editingAgentIdInput.value; 
    const agentNameToConfirm = agentNameInput.value || '当前选中的Agent';

    if (confirm(`您确定要删除 Agent "${agentNameToConfirm}" 吗？其聊天记录也将被删除，此操作不可撤销！`)) {
        const result = await window.electronAPI.deleteAgent(agentId);
        if (result.success) {
            alert(result.message || `Agent ${agentNameToConfirm} 已删除。`);
            const deletedAgentId = currentAgentId; 
            currentAgentId = null;
            
            if (deletedAgentId === agentId) {
                currentChatAgentNameH3.textContent = '选择一个Agent开始聊天';
                chatMessagesDiv.innerHTML = '';
                currentAgentSettingsBtn.style.display = 'none';
                clearCurrentChatBtn.style.display = 'none';
                messageInput.disabled = true;
                sendMessageBtn.disabled = true;
                attachFileBtn.disabled = true;
                if (window.messageRenderer) { // Clear current agent color in renderer
                    window.messageRenderer.setCurrentAgentAvatar(null);
                    window.messageRenderer.setCurrentAgentAvatarColor(null);
                    window.messageRenderer.setCurrentAgentName('AI'); // Reset agent name in renderer
                }
                await displayTopicTimestampBubble(null, null);
                document.querySelectorAll('.topic-list .topic-item.active-topic-glowing').forEach(item => {
                    item.classList.remove('active-topic-glowing');
                    item.classList.remove('active');
                });
            }
            
            await loadAgentList();
            displayAgentSettingsInTab();
        } else {
            alert(`删除Agent失败: ${result.error}`);
        }
    }
}

async function createNewContextFromCurrentAgent() {
    if (!currentAgentId) {
        alert("请先选择一个助手。");
        return;
    }

    const agentName = (document.querySelector(`.agent-list li[data-agent-id="${currentAgentId}"] .agent-name`)?.textContent || "当前助手");
    const newTopicName = `新话题 ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    console.log(`使用默认话题名称: ${newTopicName}`); 
 
    try {
        const result = await window.electronAPI.createNewTopicForAgent(currentAgentId, newTopicName);

        if (result && result.success && result.topicId) {
            currentTopicId = result.topicId;
            currentChatHistory = [];
            chatMessagesDiv.innerHTML = '';

            if (window.messageRenderer) {
                window.messageRenderer.setCurrentTopicId(currentTopicId);
                window.messageRenderer.initializeMessageRenderer({
                    currentChatHistory, currentAgentId, currentTopicId,
                    globalSettings, chatMessagesDiv, electronAPI, markedInstance,
                    scrollToBottom, summarizeTopicFromMessages, openModal, autoResizeTextarea, handleCreateBranch
                });
                window.messageRenderer.renderMessage({ role: 'system', content: `新话题 "${result.topicName}" 已开始。`, timestamp: Date.now() });
            }
            localStorage.setItem(`lastActiveTopic_${currentAgentId}`, currentTopicId);
            
            if (document.getElementById('tabContentTopics').classList.contains('active')) {
                await loadTopicList(); 
            }
            document.querySelectorAll('.topic-list .topic-item').forEach(item => {
                const isNewActiveTopic = item.dataset.topicId === currentTopicId && item.dataset.agentId === currentAgentId;
                item.classList.toggle('active', isNewActiveTopic);
                item.classList.toggle('active-topic-glowing', isNewActiveTopic);
            });
            await displayTopicTimestampBubble(currentAgentId, currentTopicId);
            messageInput.focus();
        } else {
            alert(`创建新话题失败: ${result ? result.error : '未知错误'}`);
        }
    } catch (error) {
        console.error(`创建新话题时出错:`, error);
        alert(`创建新话题时出错: ${error.message}`);
    }
}
 
let markedInstance;
if (window.marked) {
    try {
        markedInstance = new window.marked.Marked({
            sanitize: false, 
            gfm: true,
            breaks: true
        });
 
        const originalParse = markedInstance.parse.bind(markedInstance);
        markedInstance.parse = (text) => {
            if (typeof text !== 'string') {
                return originalParse(text);
            }
 
            const html = originalParse(text);
 
            const applyQuoteSpansToHtml = (inputHtml) => {
                let resultHtml = inputHtml;
 
                resultHtml = resultHtml.replace(/(“)([^”<>]*?)(”)/g, (_match, openQuote, innerContent, closeQuote) => {
                    if (innerContent.includes('class="quoted-text"')) {
                        return _match;
                    }
                    return `<span class="quoted-text">${openQuote}${innerContent}${closeQuote}</span>`;
                });
 
                const parts = resultHtml.split(/(<[^>]+>)/);
                for (let i = 0; i < parts.length; i++) {
                    if (i % 2 === 0) {
                        parts[i] = parts[i].replace(/(")([^"<>]*?)(")/g, (_match, openQuote, innerContent, closeQuote) => {
                            if (innerContent.includes('class="quoted-text"')) {
                                return _match;
                            }
                            if (innerContent.length === 0 && _match.length === 2) {
                                }
                                return `<span class="quoted-text">${openQuote}${innerContent}${closeQuote}</span>`;
                            });
                        }
                    }
                resultHtml = parts.join('');
                return resultHtml;
            };
 
            return applyQuoteSpansToHtml(html);
        };
 
    } catch (err) {
        console.warn("Failed to initialize marked with custom options, using default or basic fallback.", err);
        markedInstance = window.marked || { parse: (text) => `<p>${text.replace(/\n/g, '<br>')}</p>` };
    }
} else {
    console.warn("Marked library not found, Markdown rendering will be basic.");
    markedInstance = { parse: (text) => `<p>${text.replace(/\n/g, '<br>')}</p>` };
}
 
window.addEventListener('contextmenu', (e) => {
    if (e.target.closest('textarea, input[type="text"]')) {
    }
}, false);
 
function setupTitleBarControls() {
    console.log('[Renderer] setupTitleBarControls called.');
    console.log('[Renderer] minimizeBtn:', minimizeBtn);
    console.log('[Renderer] maximizeBtn:', maximizeBtn);
    console.log('[Renderer] restoreBtn:', restoreBtn);
    console.log('[Renderer] closeBtn:', closeBtn);
    console.log('[Renderer] window.electronAPI:', window.electronAPI);
    if (window.electronAPI) {
        console.log('[Renderer] typeof window.electronAPI.minimizeWindow:', typeof window.electronAPI.minimizeWindow);
        console.log('[Renderer] typeof window.electronAPI.maximizeWindow:', typeof window.electronAPI.maximizeWindow);
        console.log('[Renderer] typeof window.electronAPI.unmaximizeWindow:', typeof window.electronAPI.unmaximizeWindow);
        console.log('[Renderer] typeof window.electronAPI.closeWindow:', typeof window.electronAPI.closeWindow);
        console.log('[Renderer] typeof window.electronAPI.onWindowMaximized:', typeof window.electronAPI.onWindowMaximized);
        console.log('[Renderer] typeof window.electronAPI.onWindowUnmaximized:', typeof window.electronAPI.onWindowUnmaximized);
    }

    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
            window.electronAPI.minimizeWindow();
        });
    }
    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => {
            window.electronAPI.maximizeWindow();
        });
    }
    if (restoreBtn) {
        restoreBtn.addEventListener('click', () => {
            window.electronAPI.unmaximizeWindow();
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.electronAPI.closeWindow();
        });
    }
    if (settingsBtn) { 
        settingsBtn.addEventListener('click', () => {
            console.log('Settings button clicked, attempting to open dev tools.'); 
            window.electronAPI.openDevTools();
        });
    }

    if (window.electronAPI && typeof window.electronAPI.onWindowMaximized === 'function') {
        window.electronAPI.onWindowMaximized(() => {
            if (maximizeBtn) maximizeBtn.style.display = 'none';
            if (restoreBtn) restoreBtn.style.display = 'flex'; 
        });
    }

    if (window.electronAPI && typeof window.electronAPI.onWindowUnmaximized === 'function') {
        window.electronAPI.onWindowUnmaximized(() => {
            if (maximizeBtn) maximizeBtn.style.display = 'flex';
            if (restoreBtn) restoreBtn.style.display = 'none';
        });
    }
}

async function handleCreateBranch(selectedMessage) {
    if (!currentAgentId || !currentTopicId || !selectedMessage) {
        alert("无法创建分支：缺少必要信息（助手ID、当前话题ID或选定消息）。");
        return;
    }

    const messageId = selectedMessage.id;
    const messageIndex = currentChatHistory.findIndex(msg => msg.id === messageId);

    if (messageIndex === -1) {
        alert("无法创建分支：在当前聊天记录中未找到选定消息。");
        return;
    }

    const historyForNewBranch = currentChatHistory.slice(0, messageIndex + 1);

    if (historyForNewBranch.length === 0) {
        alert("无法创建分支：没有可用于创建分支的消息。");
        return;
    }

    try {
        const agentConfig = await window.electronAPI.getAgentConfig(currentAgentId);
        if (!agentConfig || agentConfig.error) {
            alert(`创建分支失败：无法获取助手配置。 ${agentConfig?.error || ''}`);
            return;
        }
        const originalTopic = agentConfig.topics.find(t => t.id === currentTopicId);
        const originalTopicName = originalTopic ? originalTopic.name : "未命名话题";
        const newBranchTopicName = `${originalTopicName} (分支)`;

        const createResult = await window.electronAPI.createNewTopicForAgent(currentAgentId, newBranchTopicName, true); 

        if (!createResult || !createResult.success || !createResult.topicId) {
            alert(`创建分支话题失败: ${createResult ? createResult.error : '未知错误'}`);
            return;
        }

        const newTopicId = createResult.topicId;
        console.log(`分支话题已创建: ${newTopicId}，名称: ${newBranchTopicName}`);

        const saveResult = await window.electronAPI.saveChatHistory(currentAgentId, newTopicId, historyForNewBranch);
        if (!saveResult || !saveResult.success) {
            alert(`无法将历史记录保存到新的分支话题: ${saveResult ? saveResult.error : '未知错误'}`);
            await window.electronAPI.deleteTopic(currentAgentId, newTopicId);
            console.warn(`已删除空的分支话题 ${newTopicId} 因为历史记录保存失败。`);
            return;
        }

        console.log(`聊天记录已成功复制到分支话题 ${newTopicId}。`);

        currentTopicId = newTopicId;
        if (window.messageRenderer) {
            window.messageRenderer.setCurrentTopicId(currentTopicId);
        }
        
        if (document.getElementById('tabContentTopics').classList.contains('active')) {
            await loadTopicList(); 
        }
        
        await loadChatHistory(currentAgentId, currentTopicId); 
        
        localStorage.setItem(`lastActiveTopic_${currentAgentId}`, currentTopicId); 

        alert(`已成功创建分支话题 "${newBranchTopicName}" 并切换。`);
        messageInput.focus();

    } catch (error) {
        console.error("创建分支时发生错误:", error);
        alert(`创建分支时发生内部错误: ${error.message}`);
    }
}