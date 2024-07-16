NAME	= maran

COMPOSEFILE = ./docker-compose.yml

all		: $(BUILD) $(NAME)

$(BUILD) :
	cd frontend && npm run build

$(NAME) :
	cd frontend && npm run build
	docker-compose  up --build #--detach 

clean :
	docker-compose  down --rmi all --remove-orphans -v

ps		: 
	docker-compose ps -a

fclean : clean
	docker system prune --volumes --all --force

re : fclean all

fe :
	docker kill docker-frontend-1



.PHONY	:	all remove ps
