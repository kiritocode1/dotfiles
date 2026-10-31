
[ -x /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"


alias pn=pnpm
alias pd="pnpm dev"
alias pb="pnpm build"
alias pt="pnpm test"
alias pc="pnpm check"
alias pst="pnpm start"

alias g="git"
alias ga="git add"
alias gc="git commit"
alias gcm="git commit -m"
alias gca="git commit --amend --no-edit"
alias gcam="git commit --amend --no-edit"
alias gp="git push"
alias gpl="git pull"
alias gst="git status"
alias gco="git checkout"
alias gcb="git checkout -b"
alias gcm="git commit -m"


# Setting PATH for Python 3.13
# The original version is saved in .zprofile.pysave
PATH="/Library/Frameworks/Python.framework/Versions/3.13/bin:${PATH}"
export PATH

# Setting PATH for Python 3.14
# The original version is saved in .zprofile.pysave
PATH="/Library/Frameworks/Python.framework/Versions/3.14/bin:${PATH}"
export PATH

# Added by OrbStack: command-line tools and integration
# This won't be added again if you remove it.
source ~/.orbstack/shell/init.zsh 2>/dev/null || :

# >>> Codex installer >>>
export PATH="$HOME/.local/bin:$PATH"
# <<< Codex installer <<<
