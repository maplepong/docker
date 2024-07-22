NAME	= maran

COMPOSEFILE = ./docker-compose.yml

FILE = $(COMPOSEFILE)

all		: $(BUILD) $(NAME)

dev : FILE = ./docker-compose.dev.yml
dev : $(NAME)

$(BUILD) :
	cd frontend && npm run build

$(NAME) :
	cd frontend && npm run build

	docker compose -f $(FILE) up --build #--detach 

clean :
	docker compose -f $(FILE)  down --rmi all --remove-orphans -v

ps		: 
	docker compose -f $(FILE) ps -a

fclean : clean
	docker system prune --volumes --all --force

re : fclean all




.PHONY	:	all ps dev clean fclean re

