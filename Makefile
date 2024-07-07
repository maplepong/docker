NAME	= maran

COMPOSEFILE = ./docker-compose.yml

all		: $(BUILD) $(NAME)

$(BUILD) :
	cd frontend && npm run build

$(NAME) :
	cd frontend && npm run build
	sudo docker compose  up --build #--detach 

clean :
	sudo docker compose  down --rmi all --remove-orphans -v

ps		: 
	sudo docker compose ps -a

fclean : clean
	sudo docker system prune --volumes --all --force

re : fclean all

fe :
	docker kill docker-frontend-1



.PHONY	:	all remove ps